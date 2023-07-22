# misc
import sys
import os

# load/save files
import json

from time import time
from sys import argv

from tensorflow import keras
from keras.utils import to_categorical
from sklearn.model_selection import train_test_split

# misc
import os, time, sys
import math, random
from timeit import default_timer as timer

# load/save files
import requests
import zipfile
import json

# plot
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from PIL import Image

# datascience libs
import numpy as np
import pandas as pd

# tensorflow
from tensorflow import keras
import tensorflow as tf
import tensorflowjs as tfjs

from keras import layers, models, optimizers, regularizers
from keras import datasets
from keras.callbacks import EarlyStopping
from keras.callbacks import ModelCheckpoint

from keras.backend import expand_dims
from keras.utils import to_categorical
from sklearn.model_selection import train_test_split




from emnist_loader import emnist_load_data



class ObjectDetectionGenerator:
    def __init__(self, X_train, y_train, X_test, y_test,
                 dir_path, dir_path_url, labels=[],
                 layers_width=300, layers_height=300,
                 random_state=1, test_size=0.25):
        self.random_state = random_state
        self.layers_width = layers_width
        self.layers_height = layers_height
        self.labels = labels
        self.max_object_count = 10 # max objects per layer

        self.objects = {
            "X_train": X_train, "y_train_id": y_train, "y_train_bbox": [],
            "X_val": [], "y_val_id": [], "y_val_bbox": [],
            "X_test": X_test, "y_test_id": y_test, "y_test_bbox": [],
        }
        self.layers = { # sprites composition
            "X_train": None, "y_train_id": None, "y_train_bbox": None,
            "X_val": None, "y_val_id": None, "y_val_bbox": None,
            "X_test": None, "y_test_id": None, "y_test_bbox": None,
        }

        self.dir_path = dir_path
        self.dir_path_url = dir_path_url
        self.dir_path_origin = os.path.join(self.dir_path, 'origin')
        self.dir_path_enhanced = os.path.join(self.dir_path, 'enhanced')


        # set arrays type
        l = self.layers
        (l["X_train"],l["y_train_id"],l["y_train_bbox"]) = self.set_X_y()
        (l["X_val"],l["y_val_id"],l["y_val_bbox"]) = self.set_X_y()
        (l["X_test"],l["y_test_id"],l["y_test_bbox"]) = self.set_X_y()

        s = self.objects
        (s["X_train"], s["X_val"],
         s["y_train_id"], s["y_val_id"]) = train_test_split(X_train, y_train,
                                                            test_size=test_size,
                                                            random_state=random_state)

    css_colors = {
        "AliceBlue": "F0F8FF", "AntiqueWhite": "FAEBD7", "Aqua": "00FFFF",
        "Aquamarine": "7FFFD4", "Azure": "F0FFFF", "Beige": "F5F5DC",
        "Bisque": "FFE4C4", "Black": "000000", "BlanchedAlmond": "FFEBCD",
        "Blue": "0000FF", "BlueViolet": "8A2BE2", "Brown": "A52A2A",
        "BurlyWood": "DEB887", "CadetBlue": "5F9EA0", "Chartreuse": "7FFF00",
        "Chocolate": "D2691E", "Coral": "FF7F50", "CornflowerBlue": "6495ED",
        "Cornsilk": "FFF8DC", "Crimson": "DC143C", "Cyan": "00FFFF",
        "DarkBlue": "00008B", "DarkCyan": "008B8B", "DarkGoldenRod": "B8860B",
        "DarkGray": "A9A9A9", "DarkGreen": "006400", "DarkKhaki": "BDB76B",
        "DarkMagenta": "8B008B", "DarkOliveGreen": "556B2F", "Darkorange": "FF8C00",
        "DarkOrchid": "9932CC", "DarkRed": "8B0000", "DarkSalmon": "E9967A",
        "DarkSeaGreen": "8FBC8F", "DarkSlateBlue": "483D8B", "DarkSlateGray": "2F4F4F",
        "DarkTurquoise": "00CED1", "DarkViolet": "9400D3", "DeepPink": "FF1493",
        "DeepSkyBlue": "00BFFF", "DimGray": "696969", "DodgerBlue": "1E90FF",
        "FireBrick": "B22222", "FloralWhite": "FFFAF0", "ForestGreen": "228B22",
        "Fuchsia": "FF00FF", "Gainsboro": "DCDCDC", "GhostWhite": "F8F8FF",
        "Gold": "FFD700", "GoldenRod": "DAA520", "Gray": "808080",
        "Green": "008000", "GreenYellow": "ADFF2F", "HoneyDew": "F0FFF0",
        "HotPink": "FF69B4", "IndianRed": "CD5C5C", "Indigo": "4B0082",
        "Ivory": "FFFFF0", "Khaki": "F0E68C", "Lavender": "E6E6FA",
        "LavenderBlush": "FFF0F5", "LawnGreen": "7CFC00", "LemonChiffon": "FFFACD",
        "LightBlue": "ADD8E6", "LightCoral": "F08080", "LightCyan": "E0FFFF",
        "LightGoldenRodYellow": "FAFAD2", "LightGrey": "D3D3D3", "LightGreen": "90EE90",
        "LightPink": "FFB6C1", "LightSalmon": "FFA07A", "LightSeaGreen": "20B2AA",
        "LightSkyBlue": "87CEFA", "LightSlateGray": "778899", "LightSteelBlue": "B0C4DE",
        "LightYellow": "FFFFE0", "Lime": "00FF00", "LimeGreen": "32CD32",
        "Linen": "FAF0E6", "Magenta": "FF00FF", "Maroon": "800000",
        "MediumAquaMarine": "66CDAA", "MediumBlue": "0000CD", "MediumOrchid": "BA55D3",
        "MediumPurple": "9370D8", "MediumSeaGreen": "3CB371", "MediumSlateBlue": "7B68EE",
        "MediumSpringGreen": "00FA9A", "MediumTurquoise": "48D1CC",
        "MediumVioletRed": "C71585", "MidnightBlue": "191970", "MintCream": "F5FFFA",
        "MistyRose": "FFE4E1", "Moccasin": "FFE4B5", "NavajoWhite": "FFDEAD",
        "Navy": "000080", "OldLace": "FDF5E6", "Olive": "808000", "OliveDrab": "6B8E23",
        "Orange": "FFA500", "OrangeRed": "FF4500", "Orchid": "DA70D6",
        "PaleGoldenRod": "EEE8AA", "PaleGreen": "98FB98", "PaleTurquoise": "AFEEEE",
        "PaleVioletRed": "D87093", "PapayaWhip": "FFEFD5", "PeachPuff": "FFDAB9",
        "Peru": "CD853F", "Pink": "FFC0CB", "Plum": "DDA0DD", "PowderBlue": "B0E0E6",
        "Purple": "800080", "Red": "FF0000", "RosyBrown": "BC8F8F", "RoyalBlue": "4169E1",
        "SaddleBrown": "8B4513", "Salmon": "FA8072", "SandyBrown": "F4A460",
        "SeaGreen": "2E8B57", "SeaShell": "FFF5EE", "Sienna": "A0522D",
        "Silver": "C0C0C0", "SkyBlue": "87CEEB", "SlateBlue": "6A5ACD",
        "SlateGray": "708090", "Snow": "FFFAFA", "SpringGreen": "00FF7F",
        "SteelBlue": "4682B4", "Tan": "D2B48C", "Teal": "008080", "Thistle": "D8BFD8",
        "Tomato": "FF6347", "Turquoise": "40E0D0", "Violet": "EE82EE", "Wheat": "F5DEB3",
        "White": "FFFFFF", "WhiteSmoke": "F5F5F5", "Yellow": "FFFF00", "YellowGreen": "9ACD32"
    }

    @staticmethod
    def list_first_val(arr):
        for i in arr:
            if i > 0:
                return 1
        return -1

    @staticmethod
    def get_bbox(data):
        """aligned-axis bounding-box (bounding square)"""
        x1 = 0xffff
        y1 = 0xffff
        x2 = 0
        y2 = 0
        # y1
        for j in range(len(data)):
            if ObjectDetectionGenerator.list_first_val(data[j]) > 0:
                y1 = j
                break
        # y2
        for j in range(len(data)):
            end = len(data)-j-1
            if ObjectDetectionGenerator.list_first_val(data[end]) > 0:
                y2 = end
                break
        # x1, x2
        for j in range(len(data)):
            ydata = data[j]
            val = 0xffff
            last = 0
            for i in range(len(ydata)):
                if ydata[i] > 0:
                    x1 = min(x1,i)
                    x2 = max(x2,i)
        return np.array([x1,y1, x2+1,y2+1])

    @staticmethod
    def get_X_bbox(X):
        bboxes = []
        for i in range(len(X)):
            bboxes.append(ObjectDetectionGenerator.get_bbox(X[i]))
            #if i > 10: break
        return bboxes

    @staticmethod
    def read_bbox_csv(dir_path, filename):
        file_path = os.path.join(dir_path, filename)
        df = pd.read_csv(file_path)
        return np.array(list(df.itertuples(index=False, name=None)))

    @staticmethod
    def write_bbox_csv(dir_path, filename, X):
        file_path = os.path.join(dir_path, filename)
        bbox = ObjectDetectionGenerator.get_X_bbox(X)
        df = pd.DataFrame(bbox, columns=['x1','y1','x2','y2'])
        df.to_csv(file_path, index=False)
        return bbox

    @staticmethod
    def scaling2D(X_train, X_val, X_test, div=[1,1]):
        mat2_div = np.array([div[0],div[1],div[0],div[1]])
        X_train_scaled = X_train / mat2_div
        X_val_scaled = X_val / mat2_div
        X_test_scaled = X_test / mat2_div
        return X_train_scaled, X_val_scaled, X_test_scaled

    @staticmethod
    def scaling3D(X_train, X_val, X_test, div=[1,1]):
        mat2_div = np.repeat([[div[0],div[1],div[0],div[1]]], 10, axis=0)
        X_train_scaled = X_train / mat2_div
        X_val_scaled = X_val / mat2_div
        X_test_scaled = X_test / mat2_div
        return X_train_scaled, X_val_scaled, X_test_scaled

    @staticmethod
    def _draw_object(src, sx,sy, s_width,s_height,
                     dst, dx,dy, d_width,d_height):
        # src
        s_width_orig = src.shape[1]
        s_height_orig = src.shape[0]
        # dst
        d_width_orig = dst.shape[1]
        d_height_orig = dst.shape[0]
        dx -= sx
        dy -= sy
        for j in range(sy,s_height):
            for i in range(sx,s_width):
                color = src[j][i]
                dst[j+dy][i+dx] = color# if color else 127
        return

    @staticmethod
    def _bbox_collide_bbox_list(x,y, bbox, pos_list,bbox_list):
        if len(bbox_list) == 0:
            return False
        a = bbox
        for i in range(len(bbox_list)):
            x2 = pos_list[i][0]
            y2 = pos_list[i][1]
            b = bbox_list[i]
            if a[2]+x < b[0]+x2 or a[0]+x > b[2]+x2:
                continue
            if a[3]+y < b[1]+y2 or a[1]+y > b[3]+y2:
                continue
            return True
        return False

    @staticmethod
    def _plt_rectangle(tup, color_id=0, text="None"):
        x1 = tup[0]
        y1 = tup[1]
        x2 = tup[2]
        y2 = tup[3]
        # body
        color = '#' + list(ObjectDetectionGenerator.css_colors.values())[color_id]
        rec_body = Rectangle((x1-0.5,y1-0.5),x2-x1,y2-y1,
                             linewidth=4,edgecolor=color,facecolor='none')
        plt.gca().add_patch(rec_body)
        # title
        if text != "None":
            bbox = dict(edgecolor='none', facecolor=color)
            plt.text(x1-0.5, y1-1.5, text,  color="black",
                     ha="left", va="bottom", fontsize=30, bbox=bbox)
        return

    @staticmethod
    def read_json_array(path):
        with open(path) as f:
            data = json.load(f)
        return np.asarray(data)

    @staticmethod
    def write_json_array(path, array):
        np.set_printoptions(threshold=1000000000)
        json_str = np.array2string(array, precision=2, separator=',')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(json_str)
        np.set_printoptions(threshold=1000)
        return

    @staticmethod
    def zipdir(path, ziph):
        for root, dirs, files in os.walk(path):
            for file in files:
                root_file = os.path.join(root, file)
                ziph.write(root_file, os.path.relpath(root_file, os.path.join(path, '..')))
        return

    @staticmethod
    def download_url(url, save_path, chunk_size=128):
        r = requests.get(url, stream=True)
        with open(save_path, 'wb') as fd:
            for chunk in r.iter_content(chunk_size=chunk_size):
                fd.write(chunk)

    def set_X_y(self, dim=0):
        height = self.layers_height
        width = self.layers_width
        return (np.zeros((dim, height, width, 1), dtype="float32"),
                np.full((dim, self.max_object_count), -1, dtype="int8"), # id
                np.zeros((dim, self.max_object_count, 4), dtype="int16")) # bbox

    def append_X_y(self, X_set, y_set_id, y_set_bbox):
        arrays = self.set_X_y(1)
        return (np.append(X_set, arrays[0], axis=0),
                np.append(y_set_id, arrays[1], axis=0),
                np.append(y_set_bbox, arrays[2], axis=0))

    def load_objects(self, gen_files=True, test_size=0.25, random_state=1):
        """
        - convert csv to png
        - load or generate+save aabb's
        """
        s = self.objects
        dir_origin = self.dir_path_origin

        if (not gen_files) or dir_origin == None:
            s["y_train_bbox"] = self.get_X_bbox(s["X_train"])
            s["y_val_bbox"] = self.get_X_bbox(s["X_val"])
            s["y_test_bbox"] = self.get_X_bbox(s["X_test"])
            return
        # folder exists ?
        if not os.path.exists(dir_origin):
            os.makedirs(dir_origin)
        # load aabb
        if os.path.exists(os.path.join(dir_origin, 'y_train_bbox.csv')):
            s["y_train_bbox"] = self.read_bbox_csv(dir_origin, 'y_train_bbox.csv')
            s["y_val_bbox"] = self.read_bbox_csv(dir_origin, 'y_val_bbox.csv')
            s["y_test_bbox"] = self.read_bbox_csv(dir_origin, 'y_test_bbox.csv')
            print("bbox CSVs loaded")
        else: # or compute them (slow!)
            print("BBOXes generation of the dataset... (it can take a while)")
            s["y_train_bbox"] = self.write_bbox_csv(dir_origin, 'y_train_bbox.csv', s["X_train"])
            s["y_val_bbox"] = self.write_bbox_csv(dir_origin, 'y_val_bbox.csv', s["X_val"])
            s["y_test_bbox"] = self.write_bbox_csv(dir_origin, 'y_test_bbox.csv', s["X_test"])
            print("bbox CSVs computed & saved")

        with zipfile.ZipFile(dir_origin+'.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
            self.zipdir(dir_origin, zipf)
        return self

    def write_layers(self, X_set="train"):
        dir_path_layers = os.path.join(self.dir_path_enhanced, X_set)
        X_set = "X_" + X_set
        images_len = len(self.layers[X_set])
        for i in range(images_len):
            png_filename = os.path.join(dir_path_layers, f"{X_set}_{i}.png")
            pixels = np.reshape(self.layers[X_set][i],(self.layers_height,self.layers_width))
            img = Image.fromarray(pixels.astype(np.uint8), mode='L')
            img.save(png_filename, format='PNG', bits=8)
        print(f"{images_len} layers images written!")
        return self

    def read_layers(self, X_set="train"):
        dir_path_layers = os.path.join(self.dir_path_enhanced, X_set)
        i = 0
        X_set = "X_" + X_set
        shape = (self.layers_height, self.layers_width, 1)
        arr = []
        while True:
            png_filename = os.path.join(dir_path_layers, f"{X_set}_{i}.png")
            if not os.path.exists(png_filename):
                break
            img = Image.open(png_filename)
            arr.append(np.reshape(img.getdata(),shape))
            i += 1
        self.layers[X_set] = np.array(arr)
        print(f"{i} layers images readed!")
        return self

    def load_layers(self, X_set="train", count=-1):
        l = self.layers
        dir_path_layers_set = os.path.join(self.dir_path_enhanced, X_set)
        # folders exists ?
        if not os.path.exists(dir_path_layers_set):
            os.makedirs(dir_path_layers_set)

        json_id_filename = f'layers_y_id_{X_set}.json'
        json_id_filepath = os.path.join(dir_path_layers_set, json_id_filename)
        json_bbox_filename = f'layers_y_bbox_{X_set}.json'
        json_bbox_filepath = os.path.join(dir_path_layers_set, json_bbox_filename)

        if not os.path.exists(json_id_filepath):
            # read json png's / id's / bbox
            self.write_layers(X_set)
            self.write_json_array(json_id_filepath, l[f"y_{X_set}_id"])
            self.write_json_array(json_bbox_filepath, l[f"y_{X_set}_bbox"])
            print(f'"{X_set}" png and bbox saved!')
        else:
            self.reset_layer(X_set)
            # read json png's / id's / bbox
            self.read_layers(X_set)
            l[f"y_{X_set}_id"] = self.read_json_array(json_id_filepath)
            l[f"y_{X_set}_bbox"] = self.read_json_array(json_bbox_filepath)
            print(f'"{X_set}" png and bbox loaded!')
        return

    def zip_folder_datasets(self):
        path = self.dir_path_enhanced
        with zipfile.ZipFile(path+'.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
            self.zipdir(path, zipf)
        return self


    def download_dataset(self, file_name = "origin.zip"):
        if len(self.dir_path_url) > 0:
            self.download_url(f"{self.dir_path_url}/{file_name}?raw=true",
                              os.path.join(self.dir_path, file_name))


    def reset_layer(self, X_set):
        l = self.layers
        (l[f"X_{X_set}"], l[f"y_{X_set}_id"], l[f"y_{X_set}_bbox"]) = self.set_X_y()
        return self

    def reset_layers(self):
        self.reset_layer("train").reset_layer("val").reset_layer("test")
        return self

    def clean_layer(self, X_set="train", layer_idx=0):
        l = self.layers
        idx = layer_idx
        y_set = "y_" + X_set
        X_set = "X_" + X_set
        if len(l[X_set]) > idx:
            (l[X_set][idx], l[y_set+"_id"][idx], l[y_set+"_bbox"][idx]) = self.set_X_y()
        return self

    def add_layer(self, X_set="train"):
        l = self.layers
        y_set = "y_" + X_set
        X_set = "X_" + X_set
        (l[X_set],
         l[y_set+"_id"],
         l[y_set+"_bbox"]) = self.append_X_y(l[X_set],l[y_set+"_id"],l[y_set+"_bbox"])
        return self

    def layer_draw_random_object(self, X_set="train",
                                 layer_idx=0, sprite_idx=0, x=None, y=None):
        l = self.layers
        s = self.objects
        y_set = "y_" + X_set
        X_set = "X_" + X_set
        dst = l[X_set][layer_idx]
        src = s[X_set][sprite_idx]
        bbox = s[y_set+'_bbox'][sprite_idx]

        if x == None:
            x = random.randint(0, self.layers_width-bbox[2])
        if y == None:
            y = random.randint(0, self.layers_height-bbox[3])

        buckets = np.where(l[y_set+"_id"][layer_idx]  == -1)[0]
        if len(buckets) == 0:
            print("Too many sprites!")
            return
        layer_sprite_idx = buckets[0]
        # id
        l[y_set+"_id"][layer_idx, layer_sprite_idx] = s[y_set+'_id'][sprite_idx]
        # bbox
        bbox_in_layer = np.array([x,y, x+(bbox[2]-bbox[0]), y+(bbox[3]-bbox[1])])
        l[y_set+"_bbox"][layer_idx, layer_sprite_idx] = bbox_in_layer
        # image
        self._draw_object(src, bbox[0],bbox[1], bbox[2],bbox[3],
                          dst, x,y, dst.shape[0],dst.shape[1])
        return self

    def layer_draw_random_objects(self, X_set="train", layer_idx=0, count=20):
        s = self.objects
        l = self.layers
        y_set = "y_" + X_set
        X_set = "X_" + X_set
        random_call_count = 0
        dst = l['X_train'][layer_idx]
        pos_list = []
        bbox_list = []

        for i in range(count):
            idx = random.randint(0, len(s[X_set]))
            src = s[X_set][idx]
            bbox = s[y_set+'_bbox'][idx]
            for j in range(200):
                x = random.randint(0, self.layers_width-bbox[2])
                y = random.randint(0, self.layers_height-bbox[3])
                collision = self._bbox_collide_bbox_list(x,y, bbox, pos_list,bbox_list)
                if collision == False:
                    break
                random_call_count += 1
                if j >= 199:
                    raise NameError('Too many loops! reduce the number of chars')
            pos_list.append([x,y])
            bbox_list.append(bbox)
            self.layer_draw_random_object(layer_idx, idx, x,y)

            """bbox_train = np.array([x,y, x+(bbox[2]-bbox[0]), y+(bbox[3]-bbox[1])])
            self.layers["y_train_bbox"][layer_index].append(bbox_train)
            self.layers["y_train_id"][layer_index].append(self.sprites['y_train'][idx])
            self._draw_sprite(src,
                              bbox[0],bbox[1], bbox[2],bbox[3],
                              dst, x,y, dst.shape[0],dst.shape[1])"""
        return self

    def transform_scale_objects(self, scale=[1,1]):
        s = self.objects
        return self.scaling2D(s["y_train_bbox"], s["y_val_bbox"], s["y_test_bbox"], scale)

    def transform_scale_layers(self, scale=[1,1]):
        l = self.layers
        return self.scaling3D(l["y_train_bbox"], l["y_val_bbox"], l["y_test_bbox"], scale)

    def show_object(self, X_set="train", idx=0):
        X_set = "X_" + X_set
        s = self.objects
        plt.imshow(s[X_set][idx], cmap='gray')
        plt.show()
        return self

    def show_layer(self, X_set="train", idx=0):
        l = self.layers
        y_set = "y_" + X_set
        X_set = "X_" + X_set
        #plt.figure(figsize = (20,int(20*(self.layers_height / self.layers_width))))
        plt.figure(figsize = (20,20))
        #print(s["X_train"][idx].shape)
        #print(s["aabb_train"][idx])
        # draw layer
        plt.imshow(l[X_set][idx], cmap='gray')
        # draw aabb's
        text = None
        for i in range(len(l[y_set+"_bbox"][idx])):
            class_id = l[y_set+"_id"][idx][i]
            color_id = class_id + 10
            if len(self.labels) > 0:
                text = self.labels[class_id]
            self._plt_rectangle(l[y_set+"_bbox"][idx][i], color_id, text)
        plt.show()
        return self






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
