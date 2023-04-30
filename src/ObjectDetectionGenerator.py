

import os
import random
import pandas as pd
import numpy as np

from tensorflow.keras import datasets
from sklearn.model_selection import train_test_split


import BinPacker



class ObjectDetectionGenerator:
    def __init__(self, X_train, y_train, X_test, y_test, dir_path=None, random_state=1, test_size=0.25):
        self.random_state = random_state
        self.sprites = {
            "X_train": X_train,
            "y_train": y_train,
            "X_val": None,
            "y_val": None,
            "X_test": X_test,
            "y_test": y_test,
            "aabb_train": None,
            "aabb_val": None,
            "aabb_test": None
        }
        self.multi = { # sprites composition
            "X_train": None,
            "y_train": None,
            "X_test": None,
            "y_test": None
        }
        self.dir_path = dir_path
        s = self.sprites
        s["X_train"],s["X_val"],s["y_train"],s["y_val"] = train_test_split(X_train, y_train,
                                                  test_size=test_size,
                                                  random_state=random_state)
        
    @staticmethod
    def list_first_val(arr):
        for i in arr:
            if i > 0:
                return 1
        return -1
    
    @staticmethod
    def get_aabb2D(data):
        
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
    def get_X_aabb2D(X):
        aabbs = []
        for i in range(len(X)):
            aabbs.append(ObjectDetectionGenerator.get_aabb2D(X[i]))
            #if i > 10: break
        return aabbs
    
    @staticmethod
    def read_aabb_csv(dir_path, filename):
        file_path = os.path.join(dir_path, filename)
        df = pd.read_csv(file_path)
        return np.array(list(df.itertuples(index=False, name=None)))

    @staticmethod
    def write_aabb_csv(dir_path, filename, X):
        file_path = os.path.join(dir_path, filename)
        aabb = ObjectDetectionGenerator.get_X_aabb2D(X)
        df = pd.DataFrame(aabb, columns=['x1','y1','x2','y2'])
        df.to_csv(file_path, index=False)
        return aabb
    
    @staticmethod
    def scaling(train, val, test, div=1):
        train_scaled = train / div
        val_scaled = val / div
        test_scaled = test / div
        return train_scaled, val_scaled, test_scaled

    @staticmethod
    def list_first_val(arr):
        for i in arr:
            if i > 0:
                return 1
        return -1
    
    @staticmethod
    def get_aabb2D(data):
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
    def get_X_aabb2D(X):
        aabbs = []
        for i in range(len(X)):
            aabbs.append(ObjectDetectionGenerator.get_aabb2D(X[i]))
            #if i > 10: break
        return aabbs
    
    @staticmethod
    def read_aabb_csv(dir_path, filename):
        file_path = os.path.join(dir_path, filename)
        df = pd.read_csv(file_path)
        return np.array(list(df.itertuples(index=False, name=None)))

    @staticmethod
    def write_aabb_csv(dir_path, filename, X):
        file_path = os.path.join(dir_path, filename)
        aabb = ObjectDetectionGenerator.get_X_aabb2D(X)
        df = pd.DataFrame(aabb, columns=['x1','y1','x2','y2'])
        df.to_csv(file_path, index=False)
        return aabb

    @staticmethod
    def scaling2D(X_train, X_val, X_test, div=[1,1]):
        mat2_div = np.array([div[0],div[1],div[0],div[1]])
        X_train_scaled = X_train / mat2_div
        X_val_scaled = X_val / mat2_div
        X_test_scaled = X_test / mat2_div
        return X_train_scaled, X_val_scaled, X_test_scaled

    def gen_sprites_aabb(self, gen_files=True, test_size=0.25, random_state=1):
        s = self.sprites
        
        if (not gen_files) or self.dir_path == None:
            s["aabb_train"] = self.get_X_aabb2D(s["X_train"])
            s["aabb_test"] = self.get_X_aabb2D(s["X_test"])
            return
        # folder exists ?
        if not os.path.exists(self.dir_path):
            os.mkdir(self.dir_path)
        # load aabb
        if os.path.exists(os.path.join(self.dir_path, 'aabb_train.csv')):
            s["aabb_train"] = self.read_aabb_csv(self.dir_path, 'aabb_train.csv')
            s["aabb_test"] = self.read_aabb_csv(self.dir_path, 'aabb_test.csv')
            print("bounding-squares csv loaded")
        else: # or compute them (slow!)
            s["aabb_train"] = self.write_aabb_csv(self.dir_path, 'aabb_train.csv', s["X_train"])
            s["aabb_test"] = self.write_aabb_csv(self.dir_path, 'aabb_test.csv', s["X_test"])
            print("bounging-squares csv computed")
        
        s["aabb_train"], s["aabb_val"] = train_test_split(s["aabb_train"],
                                                          test_size=test_size,
                                                          random_state=random_state)
    
    def reset_multi(self):
        self.multi["X_train"] = []
        return self
        
    def add_multi(self, width=300, height=300):
        self.multi["X_train"].append(np.zeros((width, height, 1)))
        return self
    
    @staticmethod
    def _draw_sprite(src, sx,sy, s_width,s_height,
                     dst, dx,dy, d_width,d_height):
        # src
        s_width_orig = src.shape[0]
        s_height_orig = src.shape[1]
        src = src.reshape(-1)
        # dst
        d_width_orig = dst.shape[0]
        d_height_orig = dst.shape[1]
        dst = dst.reshape(-1)
        dx -= sx
        dy -= sy
        
        for j in range(sy,s_height):
            for i in range(sx,s_width):
                color = src[j*s_width_orig + i]
                dst[(j+dy)*d_width_orig + (i+dx)] = color# if color else 127
    
    @staticmethod
    def _aabb_collide_aabb_list(x,y, aabb, pos_list,aabb_list):
        if len(aabb_list) == 0:
            return False
        a = aabb
        for i in range(len(aabb_list)):
            x2 = pos_list[i][0]
            y2 = pos_list[i][1]
            b = aabb_list[i]
            if a[2]+x < b[0]+x2 or a[0]+x > b[2]+x2:
                continue
            if a[3]+y < b[1]+y2 or a[1]+y > b[3]+y2:
                continue
            return True
        return False
                
    def _draw_random_sprites(self, count=20):
        random_call_count = 0
        dst = self.multi['X_train'][0]
        pos_list = []
        aabb_list = []
        
        for i in range(count):
            idx = random.randint(0, len(self.sprites['X_train']))
            src = self.sprites['X_train'][idx]
            aabb = self.sprites['aabb_train'][idx]
            for j in range(200):
                x = random.randint(0, 300-aabb[2])
                y = random.randint(0, 300-aabb[3])
                collision = self._aabb_collide_aabb_list(x,y, aabb, pos_list,aabb_list)
                if collision == False:
                    break
                random_call_count += 1
                if j >= 199:
                    raise NameError('Too many loops! reduce the number of chars')
                
            pos_list.append([x,y])
            aabb_list.append(aabb)
            #print("random call count: " + str(random_call_count))
            self._draw_sprite(src,
                              #0,0, 28,28,
                              aabb[0],aabb[1], aabb[2],aabb[3],
                              dst, x,y, dst.shape[0],dst.shape[1])
        
    def _draw_packed_sprites(self, count=20):
        random_call_count = 0
        dst = self.multi['X_train'][0]
        blocks = []
        x_pad = 2
        y_pad = 2
        
        for i in range(count):
            idx = random.randint(0, len(self.sprites['X_train']))
            src = self.sprites['X_train'][idx]
            aabb = self.sprites['aabb_train'][idx]
            blocks.append({
                "width": (aabb[2]-aabb[0]) + x_pad,
                "height": (aabb[3]-aabb[1]) + y_pad,
                "data": {
                    "idx": idx,
                }
            })
        
        # packer
        packer = BinPacker(300,300)
        res = packer.fit(blocks, ["area"])
        
        for i in range(len(res)):
            node = res[i]
            if node.data == "empty":
                continue
            idx = node.data["idx"]
            src = self.sprites['X_train'][idx]
            aabb = self.sprites['aabb_train'][idx]
            self._draw_sprite(src,
                              #0,0, 28,28,
                              aabb[0],aabb[1], aabb[2],aabb[3],
                              dst, node.x,node.y, dst.shape[0],dst.shape[1])
    
    def transform_scale(self, scale=[1,1]):
        s = self.sprites
        s["aabb_train"], s["aabb_val"], s["aabb_test"] = self.scaling2D(s["aabb_train"],
                                                                        s["aabb_val"],
                                                                        s["aabb_test"], scale)
        return s["aabb_train"], s["aabb_val"], s["aabb_test"]
    
    def show_sprite(self, idx=0):
        s = self.sprites
        plt.imshow(s["X_train"][idx], cmap='gray')
        plt.show()
        
    def show_multi(self, idx=0):
        s = self.multi
        plt.figure(figsize = (20,20))
        plt.imshow(s["X_train"][idx], cmap='gray')
        plt.show()


if __name__ == "__main__":
    (X_train, y_train), (X_test, y_test) = datasets.mnist.load_data(path="mnist.npz")
    og = ObjectDetectionGenerator(X_train, y_train, X_test, y_test,
                                  os.path.join(os.path.dirname(os.path.abspath("__file__")), 'dataset'))

