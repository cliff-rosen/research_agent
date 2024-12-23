# Research Question Analysis Flow

## A. Question Development
1. Initial Question
  - Input: User's original question
  - Process: improveQuestion
  - Output: Enhanced version of question

2. Question Enhancement
  - Input: Original question, enhanced question
  - Process: analyzeQuestionStream
  - Output: Final question to use

3. Question Validation
  - Input: Proposed final question
  - Output: Validation assessment (pass/fail with issues list)
  - Note: If fail, return to step 2 with issues list

4. Question Analysis
  - Input: Final question to use
  - Process: expandQuestionStream
  - Output: Question components and validation checklist
  - Components include:
    - Individual questions to answer
    - Validation checklist
  - Consider: completeness, consistency, logic, source reliability

## B. Knowledge Gathering
1. Query Expansion
  - Input: Question components
  - Process: executeQueriesStream
  - Output: Query set per component
  - Note: Generate N queries per component

2. Source Retrieval
  - Input: Query sets
  - Process: fetchUrls
  - Output: Document set per component
  - Note: Cross-check with analysis for coverage

3. Source Knowledge Extraction
  - Input: Document sets
  - Process: buildKBFromSources
  - Output: Extracted knowledge per component
  - Note: Cross-check with analysis for coverage

4. KB Review
  - Input: KB
  - Process: validateKB
  - Output: KB score matrix showing coverage gaps
  - Note: If insufficient, return to B1

## C. Answer Generation
1. Generate Answer
  - Input: Question, KB
  - Output: Final answer meeting component requirements

2. Answer Evaluation
  - Input: Question, components, answer
  - Output: Pass/fail with failing components
  - Note: If fail, return to C1

3. Answer Presentation
  - Input: Final answer