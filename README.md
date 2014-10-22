tessel-rater
============

A http voting system on a Tessel.io

As a lecturer I can imaging that sometimes you go to fast for the students, sometimes it's too slow, etc... During conferences the audiance wants to give feedback... and so on... so why not build a rating display with a tessel.io and 2 servo's?


More info on: http://coppieters.blogspot.be/2014/10/tesselio-voting-rating-system.html



The hardware part


1) more info on the microcontroller
- Tessel.io
- Runs JavaScript on the bare hardware with wifi onboard
- Has many plug-in IO boards (relay, gps, servo, ambient, cellular data, ...)

2) Save a power supply / need for usb cable:
- The servo board needs its own power supply anyway (adaptor included)
- I soldered a 2 pin header onto the tessel board
- Connected the power for a servo to this Vin tessel (black&red wire)

3) The dials:
- I've made 2 holes in a cardboard
- put in the servo's
- made 2 dials from hard white plastic
