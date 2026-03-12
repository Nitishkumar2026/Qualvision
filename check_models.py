import torch
from transformers import pipeline

try:
    # Try to load a zero-shot object detection pipeline
    # "google/owlv2-base-patch16-ensemble" is a common one, but it might not be cached.
    # Let's check what's available or just try a basic one.
    # detector = pipeline("zero-shot-object-detection", model="google/owlv2-base-patch16-ensemble", device=-1)
    # print("Owlv2 available")
    pass
except Exception as e:
    print(f"Owlv2 not available: {e}")

try:
    import torchvision
    # model = torchvision.models.detection.fasterrcnn_resnet50_fpn(pretrained=True)
    print(f"Torchvision version: {torchvision.__version__}")
except Exception as e:
    print(f"Torchvision not available: {e}")
