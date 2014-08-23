/**
 * Created by Neo on 22/8/14.
 */
'use strict';

(function () {
  var VS = {};
  var Util = VS.Util = {
    /**
     * 将 src 中的属性扩展到 dst 上
     * @param dst
     * @param src
     * @returns {object}
     */
    extend: function (dst, src) {
      for (var key in src) {
        if (src.hasOwnProperty(key)) {
          dst[key] = src[key];
        }
      }

      return dst;
    },
    /**
     * 随机生成 [min, max] 区间的整数
     * @param min
     * @param max
     * @returns {int}
     */
    randomInteger: function (min, max) {
//      return Math.floor(Math.random() * (max - min + 1)) + min;
      return this.mt_rand() % (max - min + 1) + min;
    },
    /**
     * 随机生成一个 bool 值，为 true 的概率为 pTrue / (pTrue + pFalse)
     * @param pTrue
     * @param pFalse
     * @returns {boolean}
     */
    randomBoolean: function (pTrue, pFalse) {
//      return Math.random() < pTrue / (pTrue + pFalse);
      return this.mt_rand() % (pTrue + pFalse) < pTrue;
    },
    /**
     * 梅森旋转演算法（Mersenne twister）：一个伪随机数发生算法，是R,Python,Ruby,IDL,Free Pascal,PHP,Maple,Matlab,GMP和GSL的默认伪随机数产生器
     */
    mt_rand: (function () {
      var MT = new Array(624);
      var index = 0;

      MT[0] = Math.floor(+new Date * Math.random());
      for (var i = 1; i < 624; i++) {
        MT[i] = 1812433253 * (MT[i - 1] ^ MT[i - 1] >> 30) + i & 0xffffffff;
      }

      /**
       * 根据 index 生成随机数
       */
      return function extract_number() {
        if (index === 0) {
          generate_numbers();
        }

        var y = MT[index];
        y = y ^ y >> 11;
        y = y ^ y << 7 & 2636928640;
        y = y ^ y << 15 & 4022730752;
        y = y ^ y >> 18;

        index = (index + 1) % 624;

        return y;
      };

      /**
       * 重新生成随机数序列
       */
      function generate_numbers() {
        for (var i = 0; i < 624; i++) {
          var y = (MT[i] & 0x80000000) + (MT[(i + 1) % 624] & 0x7fffffff);
          MT[i] = MT[(i + 397) % 624] ^ y >> 1;
          if (y % 2 !== 0) {
            MT[i] ^= 2567483615;
          }
        }
      }
    })(),
    /**
     * 自定义的 Console 输出方法
     */
    console: {
      /**
       * 输出格式化的 Console 信息
       * @param message
       * @param color
       */
      log: function (message, color) {
        color = color || 'text';
        console.log('%c' + message, 'color:' + colors[color] + ';');
      },
      /**
       * 输出程序标题
       * @param message
       */
      title: function (message) {
        console.log('%c' + message, 'color: #fff; font-size: 20px; padding: 15px 20px; background: #444; border-radius: 4px; line-height: 100px; text-shadow: 0 1px #000;');
      },
      /**
       * 输出胜利信息
       * @param message
       */
      success: function (message) {
        console.log('%c' + message, 'padding: 10px 20px; line-height: 50px; background: ' + colors.green + '; border-radius: 3px; color: #fff; font-size: 13px; font-weight: bold;');
      }
    }
  };

  /**
   * 定义 log 中文字的颜色
   * @type {object}
   */
  var colors = {
    'background': '#444',
    'text': '#666',
    'red': '#f2777a',
    'orange': '#f99157',
    'yellow': '#ffcc66',
    'green': '#99cc99',
    'aqua': '#66cccc',
    'blue': '#6699cc',
    'purple': '#cc99cc',
    'grey': '#999'
  };

  /**
   * 定义每队中玩家的人数
   * @type {number}
   */
  var playerNumber = VS.playerNumber = 5;

  var Event = VS.Event = {
    on: function (eventName, callback, context) {
      if (callback === undefined) {
        return this;
      }
      this._events = this._events || {};
      var events = (this._events[eventName] = this._events[eventName] || []);
      events.push({
        callback: callback,
        context: context || this
      });

      return this;
    },

    off: function (eventName, callback) {
      var events = this._events[eventName];
      var retain;
      if (events === undefined) {
        return this;
      }

      retain = [];
      for (var i = 0, len = events.length; i < len; i++) {
        var event = events[i];
        if (event.callback !== callback) {
          retain.push(event);
        }
      }
      if (retain.length === 0) {
        delete this._events[eventName];
      }
      else {
        this._events[eventName] = retain;
      }

      return this;
    },

    trigger: function (eventName, data) {
      var events = this._events[eventName];
      if (events === undefined) {
        return this;
      }

      events.forEach(function (event) {
        event.callback.apply(event.context, data);
      });

      return this;
    }
  };

  var Game = VS.Game = function Game() {
    this.turn = 0;
    this.observers = null;
    this.team = null;
    this.finish = false;
    this.calc = null;
    this.ready = null;
    this.beaten = null;
  };

  Util.extend(Game.prototype, Event);

  Game.prototype.init = function () {
    this.on('calc', function (id, damageTable) {
//      console.log('trigger:game:calc', id, damageTable, this.calc);
      if (this.calc[id] !== null) {
        var otherDamageTable = this.calc[id];
        this.calc = [null, null];
        this.observers[id].trigger('calc', [otherDamageTable]);
        this.observers[1 - id].trigger('calc', [damageTable]);
      }
      else {
        this.calc[1 - id] = damageTable;
      }
    });

    this.on('ready', function (id, survive) {
//      console.log('trigger:ready', id);
      /*if (this.ready[1 - id]) {
        this.observers[1 - id].attackRange = survive;
        *//*this.ready[1 - id] = false;
         this.trigger('next');*//*
        this.ready[id] = true;
      }
      else {
        this.observers[1 - id].attackRange = survive;
        this.ready[id] = true;
      }*/
      this.observers[1 - id].attackRange = survive;
      this.ready[id] = true;
      if (this.ready[1 - id]) {
        UI.next.disabled = UI.autoplay.checked || false;
      }
    });

    this.on('beaten', function (id) {
//      console.log('trigger:beaten', id);
      this.beaten[id] = true;
    });

    this.on('next', this.next);
  };

  Game.prototype.getReady = function () {
    this.turn = 0;
    this.observers = [new Observer(0), new Observer(1)];
    this.team = [new Array(playerNumber), new Array(playerNumber)];
    this.finish = false;
    this.calc = [null, null];
    this.ready = [false, false];
    this.beaten = [false, false];

    var i;
    for (i = 0; i < playerNumber; i++) {
      this.team[0][i] = new Player(i, this.observers[0]);
      this.team[1][i] = new Player(i, this.observers[1]);
    }

    this.observers[0].init(this.team[0]);
    this.observers[1].init(this.team[1]);
  };

  Game.prototype.check = function () {
    console.groupEnd();
    if (!this.beaten[0] && !this.beaten[1]) {
      return;
    }

    if (this.beaten[0] && this.beaten[1]) {
      Util.console.success('平局');
    }
    else if (this.beaten[0]) {
      Util.console.success('B 队胜利');
      console.table(this.team[1]);
    }
    else {
      Util.console.success('A 队胜利');
      console.table(this.team[0]);
    }
    this.finish = true;
    UI.autoplay.disabled = false;
    UI.start.disabled = false;
    UI.next.disabled = true;
  };

  Game.prototype.next = function () {
    this.check();
//    console.log('trigger:next');
    if (!this.finish) {
      console.group('--- ROUND ' + ++this.turn + ' ---');
      for (var i = 0; i < playerNumber; i++) {
        var teamId = Util.randomInteger(0, 1);
        if (this.team[teamId][i] !== null) {
          this.team[teamId][i].attack();
        }

        if (this.team[1 - teamId][i] !== null) {
          this.team[1 - teamId][i].attack();
        }
      }
    }
  };

  Game.prototype.start = function (duration) {
    this.getReady();
    this.trigger('next');

    if (duration > 0) {
      var timer = setInterval(function () {
        if (game.finish) {
          clearInterval(timer);
        }

        if (game.ready[0] && game.ready[1]) {
          game.ready = [false, false];
          game.trigger('next');
        }
      }, duration);
    }
  };

  var Observer = VS.Observer = function Observer(id) {
    this.id = id;
    this.name = 'OB' + id;
    this.team = null;
    this.attackRange = new Array(playerNumber);
    this.alive = 0;
    this.attackCount = 0;
    this.damageTable = new Array(playerNumber);
  };

  Util.extend(Observer.prototype, Event);

  Observer.prototype.init = function (team) {
    this.team = team;
    this.alive = team.length;
    for (var i = 0; i < playerNumber; i++) {
      this.attackRange[i] = i;
    }

    this.on('calc', this.calc);

    this.on('skip', function (name) {
//      console.log('trigger:skip', name);
      this.attackCount++;
//      console.log(this.name, this.attackCount, this.alive);
      if (this.attackCount >= this.alive) {
        this.attackCount = 0;
        var damageTable = this.damageTable;
        this.damageTable = new Array(playerNumber);
        game.trigger('calc', [this.id, damageTable]);
      }
    });

    this.on('attack', function (name, damage, toAttack) {
//      console.log('trigger:attack', name);
      this.attackCount++;
      var damages;
      if (toAttack === undefined) {
        // AOE
        for (var i = 0; i < playerNumber; i++) {
          damages = this.damageTable[i] || (this.damageTable[i] = []);
          damages.push({
            from: name,
            damage: damage,
            aoe: true
          });
        }
      }
      else {
        // Solo Attack
        damages = this.damageTable[toAttack] || (this.damageTable[toAttack] = []);
        damages.push({
          from: name,
          damage: damage,
          aoe: false
        });
      }
//      console.log(this.name, this.attackCount, this.alive);
      if (this.attackCount >= this.alive) {
        this.attackCount = 0;
        var damageTable = this.damageTable;
        this.damageTable = new Array(playerNumber);
        game.trigger('calc', [this.id, damageTable]);
      }
    });
  };

  Observer.prototype.calc = function (damageTable) {
//    console.log('trigger:observer:calc', this.id);
//    console.log('T' + game.turn, this.name, damageTable);
    var survive = [];
    var totalDamage = 0;
    for (var i = 0; i < playerNumber; i++) {
      var damages = damageTable[i];
      if (this.team[i] /*&& this.team[i].hp > 0*/ && damages !== undefined) {
        var player = this.team[i];
        for (var j = 0, len = damages.length; j < len; j++) {
          var damage = damages[j];
          var missBuf = damage.aoe ? 1.5 : 1;
          var missRate = Util.randomInteger(10 * missBuf, 30 * missBuf) / 100;
          var isMiss = Math.random() < missRate;

          if (!isMiss) {
            player.hp -= damage.damage;
            totalDamage += damage.damage;
            if (player.hp <= 0) {
              Util.console.log(damage.from + '攻击' + player.name + '，' + player.name + '倒下了', 'red');
              this.alive--;
              this.team[i] = null;
              break;
            }
          }
          Util.console.log(damage.from + '攻击' + player.name + (isMiss ? '，但被躲避了' : '，造成' + damage.damage + '点伤害，' + player.name + '剩余HP：' + player.hp), isMiss ? 'grey' : player.hp < 30 ? 'yellow' : damage.aoe ? 'blue' : 'purple');
        }
      }

      if (this.team[i]) {
        survive.push(i);
//        console.warn('A dead player ' + (this.id === 0 ? 'A' : 'B') + i + ' was attacked.', damages);
      }
    }

//    totalDamage > 0 && console.info('\t' + this.name + ': in turn ' + game.turn + ' Team ' + (this.id === 0 ? 'A' : 'B') + ' got ' + totalDamage + ' damage.');
    if (this.alive === 0) {
      game.trigger('beaten', [this.id]);
    }
//    console.log(this.name, survive);
    game.trigger('ready', [this.id, survive]);
  };

  var Player = VS.Player = function Player(id, observer) {
    this.id = id;
    this.name = (observer.id === 0 ? 'A' : 'B') + id;
    this.observer = observer;

    this.hp = 100;
    this.cd = 0;
  };

  Player.prototype.attack = function () {
    if (this.cd > 0) {
      this.observer.trigger('skip', [this.name]);
      this.cd--;
      return;
    }

    var damage;
    var attackRange = this.observer.attackRange;
    if (attackRange.length === 1 || Util.randomBoolean(4, 1)) {
      // Solo Attack
      damage = Util.randomInteger(10, 15);
      this.cd = damage;
//      console.log(this.name, attackRange);
      var toAttack = attackRange[Util.randomInteger(0, attackRange.length - 1)];
      this.observer.trigger('attack', [this.name, damage, toAttack]);
//      console.log(this.name + ' attacks ' + toAttack);
    }
    else {
      // AOE
      damage = Util.randomInteger(5, 10);
      this.cd = damage * 2;
      Util.console.log(this.name + '使用群攻攻击', 'blue');
      this.observer.trigger('attack', [this.name, damage]);
    }
  };

  var UI = VS.UI = {};
  var document = window.document;
  window.addEventListener('load', function () {

    Util.extend(window.HTMLElement.prototype, Event);
    UI = {
      autoplay: document.querySelector('#autoplay'),
      duration: document.querySelector('#duration'),
      start: document.querySelector('#start'),
      next: document.querySelector('#next')
    };
    UI.start.addEventListener('click', startHandler);

    UI.next.addEventListener('click', nextHandler);

    document.addEventListener('keydown', function (event) {
      switch (event.which) {
        case 39: {
          if (!UI.next.disabled) {
            nextHandler();
          }
          break;
        }
        case 32: {
          if (!UI.start.disabled) {
            startHandler();
          }
        }
      }
    });
    function startHandler() {
      var duration = UI.autoplay.checked ? +UI.duration.value : 0;
      UI.autoplay.disabled = true;
      UI.start.disabled = true;
      UI.next.disabled = true;
      game.start(duration);
    }
    function nextHandler() {
      UI.next.disabled = true;
      game.trigger('next');
    }
  });

  var game = new Game();

  Util.console.title('混战PK模拟器');
  Util.console.log('说明：');
  Util.console.log('\t紫色：单体攻击', 'purple');
  Util.console.log('\t蓝色：群体攻击', 'blue');
  Util.console.log('\t黄色：被攻击对象血量少于30', 'yellow');
  Util.console.log('\t灰色：攻击被躲避', 'grey');
  Util.console.log('\t红色：HP减为0', 'red');

  game.init();

  window.game = game;

})();