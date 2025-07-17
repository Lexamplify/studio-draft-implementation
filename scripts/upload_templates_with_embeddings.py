import os
from sentence_transformers import SentenceTransformer
from docx import Document
import firebase_admin
from firebase_admin import credentials, firestore, storage
import json
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('../.env')

# --- CONFIGURATION ---
TEMPLATE_DIR = "../templates"

def initialize_firebase():
    """Initialize Firebase using environment variables from .env.local"""
    try:
        # Check if already initialized
        if len(firebase_admin._apps) > 0:
            print("Firebase already initialized.")
            return
        
        # Get project ID from environment
        project_id = (
            os.environ.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID') or 
            os.environ.get('FIREBASE_PROJECT_ID') or 
            'legalease-prod'
        )
        
        storage_bucket = os.environ.get('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') or f"{project_id}.firebasestorage.app"
        
        print(f"Using project ID: {project_id}")
        print(f"Using storage bucket: {storage_bucket}")
        
        # Method 1: Try FIREBASE_CREDENTIALS JSON string (most common)
        if os.environ.get('CREDENTIALS'):
            try:
                credentials_json = json.loads(os.environ.get('CREDENTIALS'))
                cred = credentials.Certificate(credentials_json)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': storage_bucket,
                    'projectId': project_id
                })
                print("✅ Firebase initialized with FIREBASE_CREDENTIALS")
                return
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse FIREBASE_CREDENTIALS JSON: {e}")
        
        # Method 2: Try individual environment variables
        client_email = os.environ.get('CLIENT_EMAIL')
        private_key = os.environ.get('PRIVATE_KEY')
        
        if client_email and private_key:
            try:
                # Handle escaped newlines in private key
                private_key = private_key.replace('\\n', '\n')
                
                credentials_dict = {
                    "type": "service_account",
                    "project_id": project_id,
                    "client_email": client_email,
                    "private_key": private_key,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{client_email.replace('@', '%40')}"
                }
                
                cred = credentials.Certificate(credentials_dict)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': storage_bucket,
                    'projectId': project_id
                })
                print("✅ Firebase initialized with individual environment variables")
                return
            except Exception as e:
                print(f"❌ Failed to initialize with individual variables: {e}")
        
        # Method 3: Try application default credentials
        if os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
            try:
                firebase_admin.initialize_app(credentials.ApplicationDefault(), {
                    'storageBucket': storage_bucket,
                    'projectId': project_id
                })
                print("✅ Firebase initialized with application default credentials")
                return
            except Exception as e:
                print(f"❌ Failed to initialize with application default: {e}")
        
        # If all methods fail
        raise ValueError("""
❌ Missing Firebase credentials in environment variables.

Please ensure your .env.local file contains one of the following:

Option 1 - JSON credentials (recommended):
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"legalease-prod",...}

Option 2 - Individual variables:
CLIENT_EMAIL=your-service-account@legalease-prod.iam.gserviceaccount.com
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour private key here\\n-----END PRIVATE KEY-----\\n"
NEXT_PUBLIC_FIREBASE_PROJECT_ID=legalease-prod

Option 3 - Application default:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

Current environment variables found:
- NEXT_PUBLIC_FIREBASE_PROJECT_ID: """ + str(bool(os.environ.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID'))) + """
- CLIENT_EMAIL: """ + str(bool(os.environ.get('CLIENT_EMAIL'))) + """
- PRIVATE_KEY: """ + str(bool(os.environ.get('PRIVATE_KEY'))) + """
- FIREBASE_CREDENTIALS: """ + str(bool(os.environ.get('FIREBASE_CREDENTIALS'))) + """
- GOOGLE_APPLICATION_CREDENTIALS: """ + str(bool(os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'))))
        
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        raise

def load_embedding_model():
    """Load the sentence transformer model"""
    try:
        print("📥 Loading embedding model...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Embedding model loaded successfully")
        return model
    except Exception as e:
        print(f"❌ Failed to load embedding model: {e}")
        raise

def extract_text_from_docx(file_path):
    """Extract text content from DOCX file"""
    try:
        doc = Document(file_path)
        
        # Extract all paragraph text
        paragraphs = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                paragraphs.append(paragraph.text.strip())
        
        # Use first paragraph as description, or generate one
        description = paragraphs[0] if paragraphs else ""
        full_text = "\n".join(paragraphs)
        
        return description, full_text
    except Exception as e:
        print(f"❌ Failed to extract text from DOCX: {e}")
        return "", ""

def create_template_id(filename):
    """Create a clean template ID from filename"""
    name = os.path.splitext(filename)[0]
    # Clean up the name for use as Firestore document ID
    template_id = (name
                  .replace(" ", "_")
                  .replace("(", "")
                  .replace(")", "")
                  .replace(",", "")
                  .replace(".", "")
                  .replace("-", "_")
                  .replace("&", "and")
                  .lower())
    return template_id

def process_templates():
    """Process all DOCX files in the templates directory"""
    print(f"📁 Looking for templates in: {os.path.abspath(TEMPLATE_DIR)}")
    
    if not os.path.exists(TEMPLATE_DIR):
        print(f"❌ Templates directory not found: {TEMPLATE_DIR}")
        return
    
    # Get all DOCX files
    all_files = os.listdir(TEMPLATE_DIR)
    docx_files = [f for f in all_files if f.endswith(".docx") and not f.startswith("~")]
    
    if not docx_files:
        print("❌ No DOCX files found in templates directory.")
        print(f"Files found: {all_files}")
        return
    
    print(f"📋 Found {len(docx_files)} DOCX files to process:")
    for i, filename in enumerate(docx_files, 1):
        print(f"  {i}. {filename}")
    
    # Initialize Firebase and model
    initialize_firebase()
    db = firestore.client()
    bucket = storage.bucket()
    model = load_embedding_model()
    
    # Process each file
    success_count = 0
    error_count = 0
    
    for i, filename in enumerate(docx_files, 1):
        file_path = os.path.join(TEMPLATE_DIR, filename)
        name = os.path.splitext(filename)[0]
        template_id = create_template_id(filename)
        
        print(f"\n📄 [{i}/{len(docx_files)}] Processing: {filename}")
        print(f"   Template ID: {template_id}")
        
        try:
            # Extract text from DOCX
            description, full_text = extract_text_from_docx(file_path)
            
            if not description and not full_text:
                print("⚠️  Warning: No text content found in document")
                description = f"Legal document template: {name}"
            
            print(f"   Description: {description[:100]}..." if len(description) > 100 else f"   Description: {description}")
            
            # Generate embedding
            text_for_embedding = f"{name} {description}"
            embedding = model.encode(text_for_embedding).tolist()
            print("   ✅ Embedding generated")
            
            # Upload DOCX to Firebase Storage
            blob = bucket.blob(f"templates/{filename}")
            blob.upload_from_filename(file_path)
            blob.make_public()
            storage_url = blob.public_url
            print(f"   ✅ Uploaded to Storage: {storage_url}")
            
            # Store metadata + embedding in Firestore
            doc_data = {
                "id": template_id,
                "name": name,
                "description": description,
                "type": "docx",
                "storageUrl": storage_url,
                "embedding": embedding,
                "fileName": filename,
                "uploadedAt": firestore.SERVER_TIMESTAMP,
                "textLength": len(full_text),
                "embeddingDimensions": len(embedding)
            }
            
            doc_ref = db.collection('templates').document(template_id)
            doc_ref.set(doc_data)
            print(f"   ✅ Stored in Firestore with {len(embedding)} dimensions")
            
            success_count += 1
            
        except Exception as e:
            print(f"   ❌ Error processing {filename}: {str(e)}")
            error_count += 1
            continue
    
    # Summary
    print(f"\n🎉 Processing completed!")
    print(f"   ✅ Successfully processed: {success_count} files")
    if error_count > 0:
        print(f"   ❌ Failed to process: {error_count} files")
    print(f"   📊 Total files: {len(docx_files)}")

def main():
    """Main function"""
    print("🚀 Starting template upload process...")
    print("=" * 50)
    
    # Check environment file
    env_path = "../.env"
    if os.path.exists(env_path):
        print(f"✅ Found environment file: {os.path.abspath(env_path)}")
    else:
        print(f"⚠️  Environment file not found: {os.path.abspath(env_path)}")
        print("   Make sure you have a .env.local file with Firebase credentials")
    
    try:
        process_templates()
    except KeyboardInterrupt:
        print("\n⏹️  Process interrupted by user")
    except Exception as e:
        print(f"\n💥 Fatal error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())