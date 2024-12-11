import pytest
import os
from dotenv import load_dotenv

# Load environment variables for testing
load_dotenv()

# Ensure we have the required environment variables
@pytest.fixture(autouse=True)
def check_env():
    assert os.getenv('ANTHROPIC_API_KEY'), "ANTHROPIC_API_KEY environment variable is required" 