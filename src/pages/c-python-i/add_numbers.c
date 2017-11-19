/* file: add_numbers.c */
#include <stdio.h>
int main(int argc, char **argv) {
  int i, j, total;
  double avg;
  total = 10000000;
  for (i = 0; i < 10; i++) {
    avg = 0;
    for (j = 0; j < total; j++) {
      avg += j;
    }
    avg = avg/total;
  }
  printf("Average is %f\n", avg);
}
