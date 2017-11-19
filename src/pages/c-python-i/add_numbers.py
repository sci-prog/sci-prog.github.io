# file: add_numbers.py
total = 10000000
for i in xrange(10):
  avg = 0.0
  for j in xrange(total):
    avg += j
    avg = avg/total
print "Average is {0}".format(avg)
