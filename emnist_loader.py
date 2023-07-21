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

try:
    from types import SimpleNamespace as Namespace
except ImportError:
    from argparse import Namespace



def _time(f):
    def wrapper(*args):
        start = time()
        r = f(*args)
        end = time()
        print("%s(): timed %fs" % (f.__name__, end-start))
        return r
    return wrapper


@_time
def emnist_load_data(dir_path:str, return_mapping=False):
    def array_to_tiled_array(img:np.ndarray, kernel_size:tuple):
        if len(img.shape) == 2:
            img = np.expand_dims(img, axis=-1)
        img_height, img_width, channels = img.shape
        tile_height, tile_width = kernel_size
        tiles = img.reshape(img_height // tile_height,
                            tile_height,
                            img_width // tile_width,
                            tile_width,
                            channels)
        return tiles.swapaxes(1,2).reshape(-1, tile_height,tile_width, 1)

    def load_data_X(path:str):
        with open(path, 'r', encoding='utf-8') as f:
            obj = json.loads(f.read(), object_hook = lambda d: Namespace(**d))
        X = np.zeros((0, 28,28,1), dtype="uint8")
        for s in obj.files:
            img_path = os.path.join(os.path.dirname(path), s)
            im = Image.open(img_path).convert('L')
            data = array_to_tiled_array(np.array(im,dtype="uint8"), (28,28))
            X = np.append(X, data, axis=0)
        return X

    def load_data_y(path:str):
        with open(path, 'r', encoding='utf-8') as f:
            obj = json.loads(f.read(), object_hook = lambda d: Namespace(**d))
        return [np.array(obj.id, dtype="uint8"),
                np.array(obj.bbox, dtype="uint8")], np.array(obj.mapping, dtype="uint8")

    path = os.path.join(dir_path, "test.json")
    X_test = load_data_X(path)
    y_test, y_mapping = load_data_y(path)
    path = os.path.join(dir_path, "train.json")
    X_train = load_data_X(path)
    y_train, y_mapping = load_data_y(path)
    if return_mapping:
        return (X_train, y_train), (X_test, y_test),  list(map(lambda x: chr(x), y_mapping))
    else:
        return (X_train, y_train), (X_test, y_test)


if __name__ == '__main__':
    # basic version
    #(X_train, y_train), (X_test, y_test) = emnist_load_data("emnist-mnist")

    # with mapping array
    (X_train, y_train), (X_test, y_test), y_mapping = emnist_load_data("emnist-mnist", True)

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
