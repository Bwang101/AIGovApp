from datasets import load_dataset

dataset = load_dataset("BhavaishKumar112/Food_Recipe", split="train")

print(dataset.features)
