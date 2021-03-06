var assert = require('assert');
var ir = require('../');

describe('CFG IR', function() {
  it('should support example in README', function() {
    var cfg = ir.parse(function() {/*
      block B1 -> B2, B3
        arg1 = instr1 %"literal1", %42
        id2 = instr2 arg1
      block B2
        ret id2
      block B3
        ret arg1
    */});

    assert.equal(cfg.length, 3);
    assert.equal(cfg[0].id, 'B1');
    assert.equal(cfg[1].id, 'B2');
    assert.equal(cfg[2].id, 'B3');
    assert.equal(cfg[0].instructions.length, 2);
    assert.equal(cfg[1].instructions.length, 1);
    assert.equal(cfg[2].instructions.length, 1);

    var str = ir.stringify(cfg);
    assert.ok(/block B1 -> B2, B3/.test(str));
  });

  it('should support instruction without args', function() {
    var cfg = ir.parse(function() {/*
      block B1
        branch
    */});

    assert.equal(cfg.length, 1);
    assert.equal(cfg[0].id, 'B1');
    assert.equal(cfg[0].instructions[0].type, 'branch');
    assert.equal(cfg[0].instructions[0].inputs.length, 0);

    var str = ir.stringify(cfg);
    assert.ok(/branch/.test(str));
  });

  it('should support %undefined', function() {
    var cfg = ir.parse(function() {/*
      block B1
        literal %undefined
    */});

    assert.equal(cfg.length, 1);
    assert.equal(cfg[0].id, 'B1');
    assert.equal(cfg[0].instructions[0].inputs[0].type, 'js');
    assert.equal(cfg[0].instructions[0].inputs[0].value, undefined);

    var str = ir.stringify(cfg);
    assert.ok(/%undefined/.test(str));
  });

  it('should support \/ - and . in id', function() {
    var cfg = ir.parse(function() {/*
      block B1
        a/.-b = literal %undefined
    */});

    assert.equal(cfg.length, 1);
    assert.equal(cfg[0].id, 'B1');
    assert.equal(cfg[0].instructions[0].id, 'a/.-b');

    var str = ir.stringify(cfg);
    assert.ok(/a\/.-b/.test(str));
  });

  it('should support astId', function() {
    var cfg = ir.parse(function() {/*
      block B1
        a/.-b = literal %undefined # abc
    */});

    assert.equal(cfg.length, 1);
    assert.equal(cfg[0].id, 'B1');
    assert.equal(cfg[0].instructions[0].astId, 'abc');

    var str = ir.stringify(cfg);
    assert.ok(/# abc/.test(str));
  });

  it('should support astId', function() {
    var cfg = ir.parse(function() {/*
      block B0
        i51 = global # 30
    */});

    assert.equal(cfg.length, 1);
    assert.equal(cfg[0].id, 'B0');
    assert.equal(cfg[0].instructions[0].astId, '30');

    var str = ir.stringify(cfg);
    assert.ok(/# 30/.test(str));
  });

  it('should support conditionals', function() {
    var cfg = ir.parse(function() {/*
      block B1
        #if a
          doA
        #elif b
          #if a
            doBA
          #elif c
            doBC
          #elif a
            doWTF
          #else
            doWTF
          #endif
          doAfterB
        #elif c
          doC
        #end
    */}, {
      a: false,
      b: true,
      c: true
    });

    assert.equal(cfg.length, 1);
    var block = cfg[0];
    assert.equal(block.instructions.length, 2);
    assert.equal(block.instructions[0].type, 'doBC');
    assert.equal(block.instructions[1].type, 'doAfterB');
  });
});
