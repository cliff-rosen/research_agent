# this conforms FastAPI to the AWS EB requirements

# application.py
from main import app  # import your FastAPI app from wherever it currently is

# This is what EB looks for
application = app