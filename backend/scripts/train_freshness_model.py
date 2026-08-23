import sys
import os
import time
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torchvision.models import resnet18, ResNet18_Weights
import kagglehub

def train_model():
    print("Step 1: Downloading Kaggle Fruit Freshness Dataset (2GB)...")
    try:
        dataset_path = kagglehub.dataset_download("user2036/fruit-freshness-dataset-v1")
        print(f"Dataset successfully downloaded to: {dataset_path}")
    except Exception as e:
        print(f"CRITICAL: Failed to download dataset using kagglehub: {str(e)}")
        sys.exit(1)

    # Resolve train/test subdirectories
    train_dir = None
    for sub in ['train', 'train/train', 'dataset/train', 'fruit-freshness-dataset-v1/train']:
        test_path = os.path.join(dataset_path, sub)
        if os.path.exists(test_path):
            train_dir = test_path
            break
            
    if not train_dir:
        # Fallback to scanning parent folder for class directories
        train_dir = dataset_path

    print(f"Using training folder: {train_dir}")

    # Step 2: Data Loader transformations (highly optimized to 128x128 for rapid CPU training)
    data_transforms = transforms.Compose([
        transforms.Resize((128, 128)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    print("Step 3: Preparing image folder loaders...")
    try:
        train_dataset = datasets.ImageFolder(train_dir, transform=data_transforms)
        train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True, num_workers=0)
        class_names = train_dataset.classes
        print(f"Detected classes: {class_names}")
        print(f"Total training images: {len(train_dataset)}")
    except Exception as e:
        print(f"CRITICAL: Failed to read dataset directories: {str(e)}")
        sys.exit(1)

    # Step 4: Loading pre-trained ResNet18
    print("Step 4: Instantiating pre-trained ResNet18 model...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using training device acceleration: {device}")
    
    weights = ResNet18_Weights.DEFAULT
    model = resnet18(weights=weights)

    # Freeze backbone feature extractors (makes CPU training extremely fast!)
    for param in model.parameters():
        param.requires_grad = False

    # Adjust final classification linear layer to 6 classes
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, len(class_names))
    model = model.to(device)

    # Step 5: Optimization
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.fc.parameters(), lr=0.003)

    # Step 6: Training Loop (Run 1 epoch - feature extraction takes less than 2 minutes on CPU!)
    print("Step 5: Starting model fine-tuning training...")
    model.train()
    
    start_time = time.time()
    total_batches = len(train_loader)
    
    for epoch in range(1):
        running_loss = 0.0
        running_corrects = 0
        
        for i, (inputs, labels) in enumerate(train_loader):
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            _, preds = torch.max(outputs, 1)

            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

            if (i + 1) % 5 == 0 or (i + 1) == total_batches:
                batch_loss = loss.item()
                acc = torch.sum(preds == labels.data).item() / inputs.size(0) * 100
                print(f"Batch {i+1}/{total_batches} | Loss: {batch_loss:.4f} | Batch Accuracy: {acc:.1f}%")

        epoch_loss = running_loss / len(train_dataset)
        epoch_acc = running_corrects.double() / len(train_dataset) * 100
        print(f"Epoch 1 Complete | Average Loss: {epoch_loss:.4f} | Overall Accuracy: {epoch_acc:.1f}%")

    duration = time.time() - start_time
    print(f"Training completed successfully in {duration:.1f} seconds.")

    # Step 7: Saving trained weights
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(backend_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    save_path = os.path.join(models_dir, 'freshness_model.pth')
    
    # Save weights and metadata classes mapping together
    state_to_save = {
        'model_state': model.state_dict(),
        'classes': class_names
    }
    
    torch.save(state_to_save, save_path)
    print(f"Model saved successfully to: {save_path}")

if __name__ == '__main__':
    train_model()
