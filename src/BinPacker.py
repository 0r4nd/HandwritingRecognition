
import random


class BinPackerNode:
    def __init__(self, x=0, y=0, width=0,height=0, data=None, left=None,right=None):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.data = data
        self.left = left
        self.right = right

    def split(self, data, width, height):
        self.data = data
        self.left = BinPackerNode(self.x,self.y+height, self.width, self.height-height)
        self.right = BinPackerNode(self.x+width,self.y, self.width-width, height)
        return self
    
    @staticmethod
    def find(node, width, height):
        if node.data:
            return BinPackerNode.find(node.right, width, height) or BinPackerNode.find(node.left, width, height)
        elif width <= node.width and height <= node.height:
            return node
        return None


class BinPacker:
    def __init__(self, width, height):
        self.root = BinPackerNode(0,0,width,height)
    
    cbsort = {
        "w": (lambda a,b: b["width"] - a["width"]),
        "h": (lambda a,b: b["height"] - a["height"]),
        "a": (lambda a,b: b["width"]*b["height"] - a["width"]*a["height"]),
        "max": (lambda a,b: max(b["width"], b["height"]) - max(a["width"], a["height"])),
        "min": (lambda a,b: min(b["width"], b["height"]) - min(a["width"], a["height"])),
        "random": (lambda a,b: random.random() - 0.5),
        "height": (lambda a,b: BinPacker.msort(a, b, ['h','w'])),
        "width": (lambda a,b: BinPacker.msort(a, b, ['w','h'])),
        "area": (lambda a,b: BinPacker.msort(a, b, ['a','h','w'])),
        "maxside": (lambda a,b: BinPacker.msort(a, b, ['max','min','h','w'])),
    }
    
    @staticmethod
    def msort(a, b, criteria):
        diff = 0
        for n in range(len(criteria)):
            diff = BinPacker.cbsort[criteria[n]](a,b)
            if diff != 0:
                break
        return diff
    
    @staticmethod
    def swap(a,i,j):
        t = a[i]
        a[i] = a[j]
        a[j] = t

    @staticmethod
    def sort(arr, criteria = ['height']):
        for i in range(0, len(arr)-1):
            for j in range(i+1, len(arr)):
                if BinPacker.msort(arr[i], arr[j], criteria) > 0:
                    BinPacker.swap(arr,i,j)

    def fit(self, blocks_src, criteria = ['height']):
        res = []
        blocks = []
        
        for i in range(len(blocks_src)):
            blocks.append(blocks_src[i])

        BinPacker.sort(blocks, criteria)

        for i in range(len(blocks)):
            block = blocks[i]
            w = block["width"]
            h = block["height"]
            node = BinPackerNode.find(self.root, w,h)
            if not node:
                continue
            if not node.split(block["data"] if "data" in block else "empty", w,h):
                continue
            node.width = w
            node.height = h
            res.append(node)
        return res
    




if __name__ == "__main__":
    blocks = [
        { "width": 100, "height": 100, "data": {"color":0xff0000} },
        { "width": 100, "height": 100, "data": {"color":0x0000ff} },
        { "width":  80, "height":  80 },
        { "width":  80, "height":  80, "data": {"color":0x0} },
    ]
    packer = BinPacker(300,300)
    res = packer.fit(blocks, ["area"])

    for i in range(len(res)):
        node = res[i]
        if node.data == "empty":
            continue
        color = node.data["color"]
        print(node.x, node.y, node.width, node.height, color)

