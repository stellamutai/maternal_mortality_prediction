# Maternal Mortality Prediction

> An XGBoost-powered API that predicts Maternal Mortality Ratios (MMR) and risk levels based on socioeconomic health indicators.

This project provides a robust machine learning solution to forecast maternal health outcomes. By analyzing key indicators such as skilled birth attendance, antenatal care coverage, and health spending, the API helps identify high-risk periods to aid in resource allocation and planning.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

## Prerequisites
- Python 3.9 or higher
- `pip` (Python package installer)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/stellamut/maternal-mortality-prediction.git
   cd maternal-mortality-prediction
   ```

2. **Create and activate a virtual environment**
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # Linux/Mac
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify model artifacts**
   Ensure the following files are present in the root directory:
   - `best_model.pkl`
   - `feature_names.pkl`
   - `engineered_maternal_mortality.csv`

## Usage

### Local Development
Start the Flask application:
```bash
python app.py
```
The API will be available at `http://localhost:5000`.

### Data Processing Steps (Reproduction)
To reproduce the model from scratch, run the notebooks in this order:
1. `data_cleaning.ipynb`
2. `feature_engineering.ipynb`
3. `train_test_split.ipynb`
4. `advanced_models.ipynb`
5. `model_evaluation.ipynb`
6. `prediction_pipeline.ipynb`

## API Endpoints

### 1. Health Check
- **Endpoint**: `GET /health`
- **Description**: Verify API status and model loading.
- **Response**:
  ```json
  { "status": "healthy", "model_loaded": true }
  ```

### 2. Model Information
- **Endpoint**: `GET /model-info`
- **Description**: Get details about the model type, features, and risk thresholds.

### 3. Predict MMR
- **Endpoint**: `POST /predict`
- **Body**:
  ```json
  {
    "year": 2024,
    "skilled_birth_attendance": 80.0,
    "antenatal_care_coverage": 75.0,
    "health_spending": 100.0
  }
  ```
- **Response**:
  ```json
  {
    "predicted_mmr": 812.77,
    "risk_level": "Medium Risk"
  }
  ```

## Deployment
This application is ready for deployment on various platforms.

### Docker
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

### Cloud Options
- **AWS**: Elastic Beanstalk
- **Heroku**: `git push heroku main`
- **Google Cloud**: App Engine

## Contributing
Contributions are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
Distributed under the MIT License. See `LICENSE` for more information.

## Credits
- **Author**: Stella Mutai
- **Data Source**: [](https://www.who.int/publications/i/item/9789240108462)

## Visuals
*(Add screenshots of your API testing in Postman or a diagram of your model pipeline here)*