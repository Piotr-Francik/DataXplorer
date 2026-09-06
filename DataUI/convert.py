import xarray as xr
import pandas as pd # only needed if you want to do pandas stuff
import csv
from io import StringIO

array = [[0]]
counter = 0

with open('./DataUI/Dataset1.csv', 'r') as f:
    file = StringIO(f.read().replace(" ,", ",")) 
    reader = csv.reader(file, delimiter=",", quotechar="|")
    for row in reader:
        try:
            if int(row[4]) > int(array[counter][0]): 
                row[6].replace("\n",'')
                array.append(row[4:7])
                print(row)
                counter +=1

        except:
            print(row[4])
            print("not a number")


for element in array:
    print(element)

array[0] = ["Depth","Temperature","Salinity"]

with open('./DataUI/Dataset2.csv','w') as f:
    writer = csv.writer(f)
    writer.writerows(array)
    # for element in array:
    #     writer.write(element)

    