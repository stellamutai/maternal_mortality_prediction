from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pandas as pd
import numpy as np
from scipy.stats import linregress
import joblib

app = Flask(__name__)
CORS(app)

# Load model and data
model = joblib.load('best_model.pkl')
feature_names = joblib.load('feature_names.pkl')
historical_df = pd.read_csv('engineered_maternal_mortality.csv')
historical_df = historical_df.sort_values('year').reset_index(drop=True)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/history')
def get_history():
    data = historical_df[['year', 'MMR']].dropna().to_dict(orient='records')
    return jsonify(data)

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "model_loaded": True})

@app.route('/model-info')
def model_info():
    return jsonify({
        "model_type": "XGBoost Regressor",
        "features": feature_names,
        "training_years": f"{historical_df['year'].min()}-{historical_df['year'].max()}",
        "risk_thresholds": {
            "high": "> 1000",
            "medium": "500-1000",
            "low": "<= 500"
        }
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        year = data.get('year')
        skilled_birth_attendance = data.get('skilled_birth_attendance')
        antenatal_care_coverage = data.get('antenatal_care_coverage')
        health_spending = data.get('health_spending')
        
        if year is None:
            return jsonify({"error": "Year is required"}), 400
        
        # Create input data
        input_data = pd.DataFrame({
            'year': [year],
            'MMR': [np.nan],
            'skilled_birth_attendance': [skilled_birth_attendance],
            'antenatal_care_coverage': [antenatal_care_coverage],
            'health_spending': [health_spending]
        })
        
        # Append to historical data
        combined_df = pd.concat([historical_df, input_data], ignore_index=True)
        combined_df = combined_df.sort_values('year').reset_index(drop=True)
        
        # Feature engineering
        combined_df['mmr_lag_1'] = combined_df['MMR'].shift(1)
        combined_df['mmr_lag_2'] = combined_df['MMR'].shift(2)
        combined_df['mmr_3yr_avg'] = combined_df['MMR'].rolling(window=3).mean()
        combined_df['mmr_5yr_avg'] = combined_df['MMR'].rolling(window=5).mean()
        
        def calculate_slope(series):
            if len(series.dropna()) < 3:
                return np.nan
            valid_series = series.dropna()
            x = np.arange(len(valid_series))
            y = valid_series.values
            slope, _, _, _, _ = linregress(x, y)
            return slope
        
        combined_df['trend_slope'] = combined_df['MMR'].rolling(window=5, min_periods=3).apply(lambda x: calculate_slope(x), raw=False)
        combined_df['risk_flag'] = 0
        
        # Get features
        new_row = combined_df[combined_df['year'] == year]
        features = new_row[feature_names]
        
        if features[['mmr_lag_1', 'mmr_lag_2']].isnull().any().any():
            return jsonify({"error": "Insufficient historical data for prediction"}), 400
        
        # Predict
        prediction = float(model.predict(features)[0])
        
        # Risk level
        if prediction > 1000:
            risk_level = "High Risk"
        elif prediction > 500:
            risk_level = "Medium Risk"
        else:
            risk_level = "Low Risk"
        
        return jsonify({
            "predicted_mmr": prediction,
            "risk_level": risk_level
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
