# Penrose Tilings

They look so cool.
I want to do something with them.

I want to build them outward.
The recursive algorithm didn't seem like as much fun.
I want to place the tiles one at a time and sometimes I want to see two or more options.

This is similar to some of my past "fun" projects.
However, this is harder.
There is no grid known in advance.
If two pieces meet up perfectly, we need to know that, and round off error will make `==` useless.
If two pieces overlap, we need to call that an error.

## Status

I'm just barely getting started.
I'm playing around with some types and functions to try to work out the shape of this thing.
The picture in my head is vague.

## References

- https://www.math.brown.edu/reschwar/MFS/handout7.pdf – I believe this dot notation is they only way to build outward, instead of recursively.
- https://www.thingiverse.com/thing:1254773 – I want to pretend that I'm playing with the physical objects, even though I'm only working with computer images.
- [KITES AND Darts cutouts](https://www.google.com/search?safe=off&sxsrf=ALeKk025yXv3hIDOT3tY-QQTr0bzdipS_A:1604617616423&source=univ&tbm=isch&q=KITES+AND+Darts+cutouts&sa=X&ved=2ahUKEwi0t5u4wuzsAhWY9Z4KHfcyBhIQjJkEegQIDBAB&biw=1536&bih=722&dpr=2.5) – Includes angles and more.
- [Penrose Instructions](http://static1.squarespace.com/static/5754f47fcf80a16bffa02c45/t/57c6b9c5b3db2bd469e914e2/1472641508501/Penrose-instructions.pdf)
- [Penrose Tiling](https://www.google.com/search?q=penrose+tiling&safe=off&sxsrf=ALeKk01VERXgACpbcT5Z9Zlr9LZ8DXtdDQ:1604429919611&tbm=isch&source=iu&ictx=1&fir=btYSlQ2HpyTX4M%252Cn_n05pddisF3gM%252C%252Fm%252F0cgpp&vet=1&usg=AI4_-kS8TskUx1y1c4WgFqBovgMj6DNPaw&sa=X&ved=2ahUKEwilirObh-fsAhUbHzQIHRiOBnkQ_B16BAgQEAM#imgrc=btYSlQ2HpyTX4M) – More pictures.