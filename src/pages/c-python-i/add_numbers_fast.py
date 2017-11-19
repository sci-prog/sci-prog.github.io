# file: add_numbers_fast.py
from numpy import mean, arange
total = 10000000
a = arange(total)
for i in xrange(10):
  avg = mean(a)
print "Average is {0}".format(avg)
