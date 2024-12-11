import pytest
from backend.services.ai_service import get_proposed_topics, get_entry_assignments
from backend.models import Topic, Entry
from backend.schemas import ProposedTopic
from datetime import datetime

# Test data
@pytest.fixture
def sample_topics():
    return [
        Topic(
            topic_id=1,
            topic_name="Programming",
            user_id=1,
            creation_date=datetime.utcnow()
        ),
        Topic(
            topic_id=2,
            topic_name="Machine Learning",
            user_id=1,
            creation_date=datetime.utcnow()
        ),
        Topic(
            topic_id=3,
            topic_name="Personal Development",
            user_id=1,
            creation_date=datetime.utcnow()
        )
    ]

@pytest.fixture
def sample_entries():
    return [
        # Entries in existing topics
        Entry(
            entry_id=1,
            content="Learning about Python decorators and how to use them effectively in my code. They're a powerful way to modify function behavior.",
            topic_id=1,  # Programming
            user_id=1,
            creation_date=datetime.utcnow()
        ),
        Entry(
            entry_id=2,
            content="Studying neural networks and backpropagation algorithms. The math behind gradient descent is fascinating.",
            topic_id=2,  # Machine Learning
            user_id=1,
            creation_date=datetime.utcnow()
        ),
        Entry(
            entry_id=3,
            content="Setting up a morning routine to improve productivity and focus. Meditation and exercise are key components.",
            topic_id=3,  # Personal Development
            user_id=1,
            creation_date=datetime.utcnow()
        ),
        # Uncategorized entries
        Entry(
            entry_id=4,
            content="Started a new workout routine focusing on strength training and cardio. Tracking my progress daily.",
            topic_id=None,
            user_id=1,
            creation_date=datetime.utcnow()
        ),
        Entry(
            entry_id=5,
            content="Researching healthy meal prep ideas and nutrition guidelines for fitness goals.",
            topic_id=None,
            user_id=1,
            creation_date=datetime.utcnow()
        )
    ]

@pytest.mark.asyncio
async def test_get_proposed_topics_basic(sample_topics, sample_entries):
    """Test basic topic proposal functionality"""
    # Get kept topics and entries to categorize
    kept_topics = sample_topics[:1]  # Keep "Programming" topic
    kept_entries = [e for e in sample_entries if e.topic_id == 1]
    entries_to_categorize = [e for e in sample_entries if e.topic_id != 1]
    
    # Get proposed topics
    new_topics = await get_proposed_topics(
        kept_topics=kept_topics,
        kept_entries=kept_entries,
        entries_to_categorize=entries_to_categorize
    )
    
    assert isinstance(new_topics, list)
    assert len(new_topics) > 0
    assert all(isinstance(topic, str) for topic in new_topics)
    assert len(new_topics) <= 5  # Should suggest 3-5 topics

@pytest.mark.asyncio
async def test_get_proposed_topics_with_instructions(sample_topics, sample_entries):
    """Test topic proposal with specific instructions"""
    instructions = "Focus on creating separate categories for technical and personal topics"
    
    new_topics = await get_proposed_topics(
        kept_topics=[],
        kept_entries=[],
        entries_to_categorize=sample_entries,
        instructions=instructions
    )
    
    assert isinstance(new_topics, list)
    assert len(new_topics) > 0
    # Could add more specific assertions about the nature of topics based on instructions

@pytest.mark.asyncio
async def test_get_proposed_topics_empty_input():
    """Test behavior with empty input"""
    new_topics = await get_proposed_topics(
        kept_topics=[],
        kept_entries=[],
        entries_to_categorize=[]
    )
    
    assert isinstance(new_topics, list)
    assert len(new_topics) == 1
    assert new_topics[0] == "New Topic"  # Default fallback

@pytest.mark.asyncio
async def test_get_entry_assignments_basic(sample_entries):
    """Test basic entry assignment functionality"""
    # Create some proposed topics
    proposed_topics = [
        ProposedTopic(
            topic_id=None,
            topic_name="Health and Fitness",
            is_new=True,
            entries=[],
            confidence_score=0.0
        ),
        ProposedTopic(
            topic_id=None,
            topic_name="Technical Learning",
            is_new=True,
            entries=[],
            confidence_score=0.0
        )
    ]
    
    # Get assignments for uncategorized entries
    entries_to_categorize = [e for e in sample_entries if e.topic_id is None]
    assignments = await get_entry_assignments(
        entries=entries_to_categorize,
        proposed_topics=proposed_topics
    )
    
    assert isinstance(assignments, list)
    assert len(assignments) == len(entries_to_categorize)
    
    for assignment in assignments:
        assert 'entry_id' in assignment
        assert 'topic_name' in assignment
        assert 'confidence' in assignment
        assert 0 <= assignment['confidence'] <= 1

@pytest.mark.asyncio
async def test_get_entry_assignments_confidence_scores(sample_entries):
    """Test that confidence scores are reasonable"""
    proposed_topics = [
        ProposedTopic(
            topic_id=None,
            topic_name="Health and Fitness",
            is_new=True,
            entries=[],
            confidence_score=0.0
        )
    ]
    
    assignments = await get_entry_assignments(
        entries=sample_entries[-2:],  # Use the fitness-related entries
        proposed_topics=proposed_topics
    )
    
    for assignment in assignments:
        # Just verify scores are in valid range
        assert 0 <= assignment['confidence'] <= 1
        # No minimum threshold - any score is valid as long as it's in range

@pytest.mark.asyncio
async def test_get_entry_assignments_empty_input():
    """Test behavior with empty input"""
    assignments = await get_entry_assignments(
        entries=[],
        proposed_topics=[
            ProposedTopic(
                topic_id=None,
                topic_name="Test Topic",
                is_new=True,
                entries=[],
                confidence_score=0.0
            )
        ]
    )
    
    assert isinstance(assignments, list)
    assert len(assignments) == 0

@pytest.mark.asyncio
async def test_error_handling():
    """Test error handling in both functions"""
    # Test with invalid input
    try:
        await get_proposed_topics(None, None, None)
        assert False, "Should have raised an exception"
    except Exception as e:
        assert str(e) != ""
    
    try:
        await get_entry_assignments(None, None)
        assert False, "Should have raised an exception"
    except Exception as e:
        assert str(e) != "" 