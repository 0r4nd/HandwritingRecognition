# misc
import sys
import os

# load/save files
import json

# datascience libs
import numpy as np

# plot
import matplotlib.pyplot as plt
from PIL import Image

from time import time
from sys import argv

from tensorflow import keras
from keras.utils import to_categorical
from sklearn.model_selection import train_test_split


from emnist_loader import emnist_load_data









if __name__ == '__main__':
    (X_train, y_train), (X_test, y_test), y_mapping = emnist_load_data(os.path.join("datasets","emnist-balanced"), True)

    # convert target[0] to categorical
    num_classes = max(y_train[0])+1 # len(y_mapping)
    y_train[0] = to_categorical(y_train[0], num_classes = num_classes, dtype ="int8")
    y_test[0] = to_categorical(y_test[0], num_classes = num_classes, dtype ="int8")

    # add validation sets
    y_val = [None,None]
    (X_train, X_val) = train_test_split(X_train, test_size=0.25, random_state=1)
    (y_train[0], y_val[0]) = train_test_split(y_train[0], test_size=0.25, random_state=1)
    (y_train[1], y_val[1]) = train_test_split(y_train[1], test_size=0.25, random_state=1)

    # rescale
    #X_train = X_train.astype('float32') / 255.0
    #X_val = X_val.astype('float32') / 255.0
    #X_test = X_test.astype('float32') / 255.0

    print("")
    print("X_train:", X_train.shape)
    print("y_train_id:", y_train[0].shape)
    print("y_train_bbox:", y_train[1].shape)
    print("")
    print("X_val:", X_val.shape)
    print("y_val_id:", y_val[0].shape)
    print("y_val_bbox:", y_val[1].shape)
    print("")
    print("X_test:", X_test.shape)
    print("y_test_id:", y_test[0].shape)
    print("y_test_bbox:", y_test[1].shape)
    print("\nMapping:")
    print(y_mapping)
