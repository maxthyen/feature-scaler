describe('feature scaling', function() {
  const assert = require('chai').assert;
  const lib = require('../index');
  let raw;

  beforeEach(() => {
    raw = [
      { value: 7000, bool: true, str: 'saturn', float: 0.3, constant: 15, label: 0.1 },
      { value: 4000, bool: true, str: 'jupiter', float: 0.00, constant: 15, label: 0.8 },
      { value: 2500, bool: true, str: 'mars', float: 0.15, constant: 15, label: 1},
      { value: 9000, bool: false, str: 'mars', float: 0.15, constant: 15, label: 0 }
    ];
  });

  it('can encode', () => {
    const epsilon = 0.005;
    const enc = lib.encode(raw, { dataKeys: ['value', 'bool', 'str', 'float', 'constant'], labelKeys: ['label']});
    const [ e0, e1, e2, e3 ] = enc.data;
    testEncoded(e0, 0.469, 1, [1, 0, 0], 1.22, 0, -0.751);
    testEncoded(e1, -0.555, 1, [0, 1, 0], -1.22, 0, 0.651);
    testEncoded(e2, -1.067, 1, [0, 0, 1], 0, 0, 1.051);
    testEncoded(e3, 1.153, 0, [0, 0, 1], 0, 0, -0.951);

    function testEncoded(el, value, bool, str, float, constant, label) {
      assert.approximately(el[0], value, epsilon);
      assert.equal(el[1], bool);
      assert.deepEqual(el.slice(2,5), str);
      assert.approximately(el[5], float, epsilon);
      assert.approximately(el[6], constant, epsilon);
      assert.approximately(el[7], label, epsilon);
      assert.equal(el.length, 8);
    }
  });

  it('can decode', () => {
    const epsilon = 0.005;
    const enc = lib.encode(raw, { dataKeys: ['value', 'bool', 'str', 'float', 'constant'], labelKeys: ['label']});
    const [ d0, d1, d2, d3, d4 ] = lib.decode(enc.data, enc.decoders);
    testDecoded(d0, raw[0]);
    testDecoded(d1, raw[1]);
    testDecoded(d2, raw[2]);
    testDecoded(d3, raw[3]);

    function testDecoded(d, expected) {
      assert.approximately(d.value, expected.value, epsilon);
      assert.equal(d.bool, expected.bool);
      assert.equal(d.str, expected.str);
      assert.approximately(d.float, expected.float, epsilon);
      assert.approximately(d.label, expected.label, epsilon);
    }
  });

});
