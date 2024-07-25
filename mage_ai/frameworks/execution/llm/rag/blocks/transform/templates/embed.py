TEMPLATES = """
### tf_idf.py

tf_idf:
  description: 'Term frequency-inverse document frequency: convert text into numerical representation by computing the importance of words in documents.'
  name: 'TF-IDF'
  path: transformers/embeddings/tf_idf.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    vocabulary:
      description: 'Vocabulary list for the TF-IDF transformation.'
      name: 'Vocabulary'
      input: text
      required: true
      types:
        - list
    max_features:
      description: 'Maximum number of features (i.e., words) to consider.'
      name: 'Max features'
      input: text
      required: false
      types:
        - integer
      value: 5000  # Default value
    smooth_idf:
      description: 'Smoothen idf weights by adding one to document frequencies, as if an extra document was seen containing every term in the collection exactly once.'
      name: 'Smooth idf'
      input: text
      required: false
      types:
        - boolean
      value: true  # Default value

### word2vec.py

word2vec:
  description: 'Create word embeddings by training a neural network on a large corpus of text.'
  name: 'Word2vec'
  path: transformers/embeddings/word2vec.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    vector_size:
      description: 'Dimension of the word vectors.'
      name: 'Vector size'
      input: text
      required: true
      types:
        - integer
    window:
      description: 'Maximum distance between the current and predicted word within a sentence.'
      name: 'Window size'
      input: text
      required: false
      types:
        - integer
      value: 5  # Default value
    min_count:
      description: 'Ignores all words with total frequency lower than this.'
      name: 'Min count'
      input: text
      required: false
      types:
        - integer
      value: 1  # Default value
    workers:
      description: 'Number of worker threads to train the model.'
      name: 'Workers'
      input: text
      required: false
      types:
        - integer
      value: 3  # Default value

### glove.py

glove:
  description: 'Generate word embeddings by analyzing word co-occurrence statistics in a corpus.'
  name: 'Glove'
  path: transformers/embeddings/glove.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    embedding_size:
      description: 'Dimension of the word embeddings.'
      name: 'Embedding size'
      input: text
      required: true
      types:
        - integer
    window_size:
      description: 'Number of context words to consider to the left and right.'
      name: 'Window size'
      input: text
      required: false
      types:
        - integer
      value: 15  # Default value
    iterations:
      description: 'Number of training iterations.'
      name: 'Iterations'
      input: text
      required: false
      types:
        - integer
      value: 100  # Default value
    min_count:
      description: 'Minimum count of words to consider.'
      name: 'Min count'
      input: text
      required: false
      types:
        - integer
      value: 5  # Default value

### fasttext.py

fasttext:
  description: 'Extend Word2Vec by considering subword information, which helps in handling out-of-vocabulary words.'
  name: 'fastText'
  path: transformers/embeddings/fasttext.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    embedding_size:
      description: 'Dimension of the word embeddings.'
      name: 'Embedding size'
      input: text
      required: true
      types:
        - integer
    window:
      description: 'Maximum distance between the current and predicted word within a sentence.'
      name: 'Window size'
      input: text
      required: false
      types:
        - integer
      value: 5  # Default value
    min_count:
      description: 'Ignores all words with total frequency lower than this.'
      name: 'Min count'
      input: text
      required: false
      types:
        - integer
      value: 1  # Default value
    epochs:
      description: 'Number of training epochs.'
      name: 'Epochs'
      input: text
      required: false
      types:
        - integer
      value: 5  # Default value

### bert.py

bert:
  description: 'A transformer-based model that provides contextual embeddings by considering the entire sentence.'
  name: 'BERT'
  path: transformers/embeddings/bert.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    model_name:
      description: 'Name of the pre-trained BERT model.'
      name: 'Model name'
      input: text
      required: true
      types:
        - string
    max_length:
      description: 'Maximum length of the input sequences.'
      name: 'Max length'
      input: text
      required: false
      types:
        - integer
      value: 128  # Default value

### roberta.py

roberta:
  description: 'An optimized version of BERT with better performance on various NLP tasks.'
  name: 'RoBERTa'
  path: transformers/embeddings/roberta.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    model_name:
      description: 'Name of the pre-trained RoBERTa model.'
      name: 'Model name'
      input: text
      required: true
      types:
        - string
    max_length:
      description: 'Maximum length of the input sequences.'
      name: 'Max length'
      input: text
      required: false
      types:
        - integer
      value: 128  # Default value

### gpt.py

gpt:
  description: 'Generates embeddings using a generative model pre-trained on a large corpus.'
  name: 'Generative Pre-trained Transformer'
  path: transformers/embeddings/gpt.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    model_name:
      description: 'Name of the pre-trained GPT model.'
      name: 'Model name'
      input: text
      required: true
      types:
        - string
    max_length:
      description: 'Maximum length of the input sequences.'
      name: 'Max length'
      input: text
      required: false
      types:
        - integer
      value: 128  # Default value

### t5.py

t5:
  description: 'A transformer model that converts all NLP problems into a text-to-text format, providing versatile embeddings.'
  name: 'T5'
  path: transformers/embeddings/t5.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    model_name:
      description: 'Name of the pre-trained T5 model.'
      name: 'Model name'
      input: text
      required: true
      types:
        - string
    max_length:
      description: 'Maximum length of the input sequences.'
      name: 'Max length'
      input: text
      required: false
      types:
        - integer
      value: 128  # Default value

### sentence_bert.py

sentence_bert:
  description: 'Sentence-BERT models like all-mpnet-base-v2 provide high-quality sentence embeddings that capture semantic meaning. They are widely used for text similarity tasks in RAG.'
  name: 'Sentence-BERT'
  path: transformers/embeddings/sentence_bert.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    model_name:
      description: 'Name of the pre-trained Sentence-BERT model.'
      name: 'Model name'
      input: text
      required: true
      types:
        - string
    max_length:
      description: 'Maximum length of the input sequences.'
      name: 'Max length'
      input: text
      required: false
      types:
        - integer
      value: 128  # Default value

### universal_sentence_encoder.py

universal_sentence_encoder:
  description: 'Provide embeddings for sentences or phrases, optimized for transfer learning.'
  name: 'Universal sentence encoder'
  path: transformers/embeddings/universal_sentence_encoder.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    model_name:
      description: 'Name of the pre-trained Universal Sentence Encoder model.'
      name: 'Model name'
      input: text
      required: true
      types:
        - string

### domain_specific_fine_tuned.py

domain_specific_fine_tuned:
  description: 'Pre-trained models can be fine-tuned on domain-specific data to create embeddings that better capture the nuances and terminology of that domain. This improves retrieval relevance for RAG in specialized fields.'
  name: 'Domain specific fine tuned models'
  path: transformers/embeddings/domain_specific_fine_tuned.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    base_model_name:
      description: 'Name of the base pre-trained model.'
      name: 'Base model name'
      input: text
      required: true
      types:
        - string
    fine_tuning_data_path:
      description: 'Path to the domain-specific fine-tuning data.'
      name: 'Fine-tuning data path'
      input: text
      required: true
      types:
        - string

### multilingual_models.py

multilingual_models:
  description: 'Multilingual embedding models like paraphrase-multilingual-mpnet-base-v2 enable RAG applications that need to handle multiple languages.'
  name: 'Multilingual models'
  path: transformers/embeddings/multilingual_models.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    model_name:
      description: 'Name of the pre-trained multilingual model.'
      name: 'Model name'
      input: text
      required: true
      types:
        - string
    max_length:
      description: 'Maximum length of the input sequences.'
      name: 'Max length'
      input: text
      required: false
      types:
        - integer
      value: 128  # Default value

### multimodal_embeddings.py

multimodal_embeddings:
  description: 'Models like OpenAI’s CLIP or Google’s Imagen allow creating unified embeddings across text, images, audio, and video. This enables multimodal RAG that can retrieve relevant context from various media types.'
  name: 'Multimodal embeddings'
  path: transformers/embeddings/multimodal_embeddings.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    model_name:
      description: 'Name of the pre-trained multimodal model.'
      name: 'Model name'
      input: text
      required: true
      types:
        - string
    max_length:
      description: 'Maximum length of the input sequences.'
      name: 'Max length'
      input: text
      required: false
      types:
        - integer
      value: 128  # Default value

### embedding_truncation_compression.py

embedding_truncation_compression:
  description: 'Techniques like Matryoshka Representation Learning allow truncating embeddings to lower dimensions with minimal performance loss. This improves efficiency and reduces storage costs.'
  name: 'Embedding truncation/compression'
  path: transformers/embeddings/embedding_truncation_compression.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    original_model_name:
      description: 'Name of the original pre-trained model.'
      name: 'Original model name'
      input: text
      required: true
      types:
        - string
    truncated_dim:
      description: 'Dimension to truncate the embeddings to.'
      name: 'Truncated dim'
      input: text
      required: true
      types:
        - integer

### asymmetric_embeddings.py

asymmetric_embeddings:
  description: 'Using different input types (e.g., search_document vs. query) when creating embeddings for the knowledge base vs. user queries. Enables more effective retrieval when comparing short queries to longer passages.'
  name: 'Asymmetric embeddings'
  path: transformers/embeddings/asymmetric_embeddings.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    search_model_name:
      description: 'Name of the model for embedding search documents.'
      name: 'Search model name'
      input: text
      required: true
      types:
        - string
    query_model_name:
      description: 'Name of the model for embedding queries.'
      name: 'Query model name'
      input: text
      required: true
      types:
        - string

### embedding_ensembles.py

embedding_ensembles:
  description: 'Combining multiple embedding models and aggregating their outputs can sometimes yield better results than any single model. Useful when dealing with diverse data.'
  name: 'Embedding ensembles'
  path: transformers/embeddings/embedding_ensembles.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    model_names:
      description: 'List of pre-trained models to combine in the ensemble.'
      name: 'Model names'
      input: text
      required: true
      types:
        - list

### spacy_embeddings.py

spacy_embeddings:
  description: 'Generate embeddings using spaCy models.'
  name: 'spaCy embeddings'
  path: transformers/embeddings/spacy_embeddings.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    model_name:
      description: 'Name of the pre-trained SpaCy model.'
      name: 'Model name'
      input: text
      required: true
      types:
        - string
      value: 'en_core_web_sm'  # Default value

### openai_ada.py

openai_ada:
  description: "OpenAI's text-embedding-ada-002 model is a popular choice for creating embeddings in RAG applications. It provides good performance and is easy to use via API."
  name: 'OpenAI'
  path: transformers/embeddings/api/openai_ada.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    model_name:
      description: 'Name of the OpenAI Ada model.'
      name: 'Model name'
      input: text
      required: true
      types:
        - string
    api_key:
      description: 'API key for accessing OpenAI services.'
      name: 'Api key'
      input: text
      required: true
      types:
        - string
    max_length:
      description: 'Maximum length of the input sequences.'
      name: 'Max length'
      input: text
      required: false
      types:
        - integer
      value: 2048  # Default value

### cohere_embed.py

cohere_embed:
  description: 'Cohere offers powerful embedding models like embed-english-v3.0 that support asymmetric semantic search for improved RAG performance when comparing queries to longer documents.'
  name: 'Cohere embed'
  path: transformers/embeddings/api/cohere_embed.py
  type: transformer
  inputs:
    text:
      style:
        input_type: null
        multiline: false
        monospace: false
      type: text_field
  variables:
    model_name:
      description: 'Name of the Cohere embedding model.'
      name: 'Model name'
      input: text
      required: true
      types:
        - string
    api_key:
      description: 'API key for accessing Cohere services.'
      name: 'Api key'
      input: text
      required: true
      types:
        - string
    max_length:
      description: 'Maximum length of the input sequences.'
      name: 'Max length'
      input: text
      required: false
      types:
        - integer
      value: 512  # Default value
"""