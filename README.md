# feature-scaler

`feature-scaler` is a utility that transforms a list of arbitrary JavaScript objects into a normalized format suitable for feeding into machine learning algorithms. It can also decode encoded data back into its original format.

**Motivation**: I use Andrej Karpathy's excellent [convnetjs](https://github.com/karpathy/convnetjs/blob/master/demo/regression.html) library to experiment with neural networks in JavaScript and often have to preprocess my data before training a network. This utility makes it easy to encode data in a format usable by `convnetjs`.

"Why JavaScript?" is a fair question - Python's `scikit-learn` has most of the data preprocessing features you may need. I wrote this mainly because I wanted an easy way to use `convnetjs` without communicating across languages. If your data is big enough that `convnetjs` or the performance of the V8 engine in node.js is the limiting factor in your workflow, don't use JavaScript!

Field types currently supported: `ints`, `floats`, `bools`, and `strings`.

Check out tests/main.spec.js for a demo of this library in action.

In the following documentation, I'll use `planetList` as the example data set we're transforming. It looks like this:
```JavaScript
const planetList = [
  { planet: 'mars', isGasGiant: false, value: 10 },
  { planet: 'saturn', isGasGiant: true, value: 20 },
  { planet: 'jupiter', isGasGiant: true, value: 30 }
]
```

The independent variables are `planet` and `isGasGiant`.
The dependent variable is `value`.

### `encode(data, opts = { dataKeys, labelKeys })`
* `data`: list of raw data you need encoded. Assumptions: all entries in this list have the same structure as the first entry in the list. If the first element in `data` has a key called `isGasGiant`, and `data[0].isGasGiant === true`, `isGasGiant` should be a `boolean` for all objects in the list.
* `opts`
 * `opts.labelKeys` - list of keys you are predicting values for (`value`).
 * `opts.dataKeys` *optional* - list of *independent* keys (`planet`, `isGasGiant`). If not provided, defaults to all keys minus `opts.labelKeys`.

Example usage:
```JavaScript
const dataKeys = ['planet', 'isGasGiant'];
const labelKeys = ['value']
const encodedInfo = encode(planetList, { dataKeys: ['value']});

// encodedInfo.data
[ [ 1, 0, 0, 0, -1 ], [ 0, 1, 0, 1, 0 ], [ 0, 0, 1, 1, 1 ] ]
// Note: as is the norm with machine learning algorithms,
// "label" data is at the end of each row.
// encodedInfo.data[0][4] === -1; the scaled label value for Mars.

// encodedInfo.decoders - can be treated as a black box
[
  { key: 'planet', type: 'string', offset: 3, lookupTable: ['mars','saturn','jupiter'] },
  { key: 'isGasGiant', type: 'boolean' },
  { key: 'value', type: 'number', mean: 20, std: 10 }
]
```

Each entry in the "decoders" list is metadata from the original dataset. It contains information on how to transform an encoded row back into the original `{ key: value }` pairs. Your code should not modify this list. The only thing you should do with it is feed it back into `decode`, described below.

Note: `encodedInfo` can safely be serialized to JSON and saved for later use with `JSON.stringify(encodedInfo)`.

### `decode(encodedData, decoders)`
* `encodedData` - the `data` from `encode` output
* `decoders` - the `decoders` from `encode` output

It returns the list of data in its original format.

### `decodeRow(encodedRow, decoders)`
Similar to `decode`, but operates on a single row. e.g.
```JavaScript
decodeRow(encodedData[0], decoders) === decode(encodedData, decoders)[0]
```


## Technical details
A nice post on feature scaling and why it's necessary was written by Sebastian Raschka, check it out here: http://sebastianraschka.com/Articles/2014_about_feature_scaling.html

The short version is this library encodes data in the following ways
* Number fields: `(n - mean) / sttdev`
* Boolean fields: `n ? 1 : 0`
* String fields: one-hot encoding (see below).

#### One-hot encoding
Standardizing numbers and booleans is easy, but categorical string data is a little trickier. In the example above, transforming `['mars', 'jupiter', 'saturn']` into a single number value falsely implies\* there is an ordering to the underlying value. Suppose you had a variable that represented the weather; there is no logical ordering to `['rain', 'sun', 'overcast']`. If we naively had a sinlge numeric "weather" column where `rain=0`, `sun=1`, `overcast=2`, some machine learning algorithms would treat that field as "ordered".

Instead, we need to map these strings to a list of single-valued binary values. In the planets example, we see the following encodings:
* `mars` ==    `[0, 0, 1]`
* `saturn` ==  `[0, 1, 0]`
* `jupiter` == `[1, 0, 0]`
We can feed this into an arbitrary machine learning algorithm without the possibility of it inferring an ordering to our data.


Decent intro/motivation for one-hot encoding: https://code-factor.blogspot.com/2012/10/one-hotone-of-k-data-encoder-for.html

\* In our example, there is indeed an ordering to the planets! If the ordering is important, add a calculated field to the data before encoding. You could add a `numberOfPlanetFromSun` integer field to each record before encoding if the ordering of categorical data is important.

### Further Reading
* https://github.com/karpathy/convnetjs/blob/master/demo/regression.html

#### Todo
* Add support for decoding a single value (currently only decoding a whole row is supported)
* Add support for unrolling nested objects
* Add support for missing data
* Currently it standardizes numeric values; perhaps add support for scaling numeric values to [0, 1].
