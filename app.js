/**
 * @author Neo
 * @version 0.0.1
 * @link http://nilennoct.com/gamberetto-festvial/ Demo
 */
'use strict';

(function () {
  /** console.table 不可用时用 console.log 替代 */
  console.table = console.table || console.log;

  var VS = {};
  var game;

  var Util = VS.Util = {
    /**
     * 将 src 中的属性扩展到 dst 上
     * @param {object} dst
     * @param {object} src
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
     * @param {int} min
     * @param {int} max
     * @returns {int}
     */
    randomInteger: function (min, max) {
      return this.mt_rand() % (max - min + 1) + min;
    },
    /**
     * 随机生成一个 bool 值，为 true 的概率为 pTrue / (pTrue + pFalse)
     * @param {number} pTrue
     * @param {number} pFalse
     * @returns {boolean}
     */
    randomBoolean: function (pTrue, pFalse) {
      return this.mt_rand() % (pTrue + pFalse) < pTrue;
    },
    /**
     * 梅森旋转演算法（Mersenne twister）: 一个伪随机数发生算法
     * Python, Ruby, PHP, Maple, Matlab, GMP和GSL的默认伪随机数产生器
     */
    mt_rand: (function () {
      var MT = new Array(624);
      var index = 0;

      /** 随机生成种子 */
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
       * @param {string} message
       * @param {string} [color='text']
       */
      log: function (message, color) {
        color = color || 'text';
        console.log('%c' + message, 'color:' + colors[color] + ';');
      },
      /**
       * 输出程序标题
       * @param {string} message
       */
      title: function (message) {
        console.log('%c' + message, 'color: #fff; font-size: 20px; padding: 15px 20px; background: #444; border-radius: 4px; line-height: 100px; text-shadow: 0 1px #000;');
      },
      /**
       * 输出胜利信息
       * @param {int} status
       */
      success: function (status) {
        var message = status === 3 ? '平局' : status === 2 ? 'A 队胜利' : 'B 队胜利';
        console.log('%c' + message, 'padding: 10px 20px; line-height: 50px; background: ' + colors.green + '; border-radius: 30px; color: #fff; font-size: 13px; font-weight: bold;');
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
   * @type { int}
   */
  var playerNumber = VS.playerNumber = 5;

  /**
   * 实现简单的事件绑定
   */
  var Event = VS.Event = {
    /**
     * 绑定事件
     * @param {string} eventName - 事件名
     * @param {function} callback - 回调函数
     * @param {*} [context=this] - 上下文
     * @returns {*}
     */
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
    /**
     * 取消绑定，callback 为 undefined 时取消所有名为 eventName 的事件
     * @param {string} eventName
     * @param {function} [callback]
     * @returns {*}
     */
    off: function (eventName, callback) {
      var events = this._events[eventName];
      var retain;
      if (events === undefined) {
        return this;
      }

      if (callback === undefined) {
        delete this._events[eventName];
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
    /**
     * 触发事件
     * @param {string} eventName
     * @param {*[]} [data]
     * @returns {*}
     */
    trigger: function (eventName, data) {
      var events = this._events[eventName];
      if (events === undefined) {
        return this;
      }

      events.forEach(function (event) {
        if (data === undefined) {
          event.callback.call(event.context);
        }
        else {
          event.callback.apply(event.context, data);
        }
      });

      return this;
    }
  };

  /**
   * Game类，记录游戏的运行状态，裁判、选手的信息，并为裁判交流提供平台
   * @class Game Game
   */
  var Game = VS.Game = function Game() {
    this.init();
  };

  Util.extend(Game.prototype, Event);

  /**
   * 初始化游戏，绑定事件
   */
  Game.prototype.init = function gameInit() {
    /**
     * 用于裁判交换伤害表，并通知裁判开始计算本回合伤害
     * @param {Observer.id} id - 裁判ID
     * @param {object[]} damageTable - 敌方队伍受到的伤害表
     */
    this.on('calc', function gameCalc(id, damageTable) {
      if (this.exchange !== null) {
        this.observers[1 - id].trigger('calc', [damageTable]);
        this.observers[id].trigger('calc', [this.exchange]);
        this.exchange = null;
      }
      else {
        this.exchange = damageTable;
      }
    });

    /**
     * 用于裁判计算完本回合伤害后，交换存活玩家表，同时表示该队回合结束
     * @param {Observer.id} id - 裁判ID
     * @param {Player.id[]} survive - 本队伍的存活玩家表
     */
    this.on('ready', function teamReady(id, survive) {
      this.observers[1 - id].attackRange = survive;
      if (this.ready !== 0) {
        UI.next.disabled = UI.autoplay.checked || false;
      }
      this.ready |= id + 1;
    });

    /**
     * 用于裁判通知队伍被击败
     * @param {Observer.id} id - 裁判ID
     */
    this.on('beaten', function teamBeaten(id) {
      this.finish |= id + 1;
    });

    /**
     * 双方队伍都准备好后，开始下一回合，详见 Game.prototype.next
     */
    this.on('next', this.next);

    this.getReady();
  };

  /**
   * 设置游戏状态，创建 Observer 和 Player
   */
  Game.prototype.getReady = function () {
    this.turn = 0;
    this.observers = [new Observer(0), new Observer(1)];
    this.team = [new Array(playerNumber), new Array(playerNumber)];
    this.finish = 0;
    this.ready = 3;
    this.exchange = null;

    var i;
    for (i = 0; i < playerNumber; i++) {
      this.team[0][i] = new Player(i, this.observers[0]);
      this.team[1][i] = new Player(i, this.observers[1]);
    }

    this.observers[0].init(this.team[0]);
    this.observers[1].init(this.team[1]);
  };

  /**
   * 检查游戏状态，是否有队伍胜出
   */
  Game.prototype.check = function () {
    if (this.finish === 0) {
      return;
    }

    Util.console.success(this.finish);
    if (this.finish !== 3) {
      console.table(this.team[1 - (this.finish >> 1)]);
    }

    UI.autoplay.disabled = false;
    UI.start.disabled = false;
    UI.next.disabled = true;
  };

  /**
   * 进入游戏的下一回合
   */
  Game.prototype.next = function () {
    this.check();
    if (this.finish !== 0 || this.ready !== 3) {
      return;
    }
    this.ready = 0;
    console.group('--- ROUND ' + ++this.turn + ' ---');
    for (var i = 0; i < playerNumber; i++) {
      /** 伤害是统一处理的，因此攻击的先后顺序不会影响攻击的结果 */
      if (this.team[0][i] !== null) {
        this.team[0][i].attack();
      }

      if (this.team[1][i] !== null) {
        this.team[1][i].attack();
      }
    }
    console.groupEnd();
  };

  /**
   * 开始一场新游戏
   * @param {int} duration - 自动运行时，每回合暂停时间
   */
  Game.prototype.start = function (duration) {
    this.finish !== 0 && this.getReady();
    this.trigger('next');

    if (duration > 0) {
      var timer = setInterval(function () {
        if (game.finish) {
          clearInterval(timer);
        }

        game.trigger('next');
      }, duration);
    }
  };

  /**
   * Observer的构造函数
   * @constructor
   * @class Observer Observer
   * @classdesc Observer类，记录每个玩家的攻击和存活状态，并在一方玩家全灭时宣布游戏结束
   */
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

  /**
   * 初始化，设定该裁判负责的队伍，并绑定事件
   * @param team
   */
  Observer.prototype.init = function (team) {
    this.team = team;
    this.alive = team.length;

    /** 初始化 attackRange，此项记录了敌方存活的玩家 id */
    for (var i = 0; i < playerNumber; i++) {
      this.attackRange[i] = i;
    }

    /**
     * 处理 calc 事件，详见 Observer.prototype.calc
     */
    this.on('calc', this.calc);

    /**
     * 处理 skip 事件，当玩家处于技能冷却状态时会触发该事件
     */
    this.on('skip', function playerSkip() {
      if (++this.attackCount >= this.alive) {
        this.attackCount = 0;
        var damageTable = this.damageTable;
        this.damageTable = new Array(playerNumber);
        game.trigger('calc', [this.id, damageTable]);
      }
    });

    /**
     * 处理 attack 事件，通过 damageTable 存储攻击记录，统一由另一个 OB 计算
     * @param {string} name - 攻击者名字
     * @param {int} damage - 攻击伤害
     * @param {int} [toAttack] - 被攻击者 id，为空即为群体攻击
     */
    this.on('attack', function playerAttack(name, damage, toAttack) {
      var damages;
      if (toAttack === undefined) {
        /** 处理群体攻击 */
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
        /** 处理单体攻击 */
        damages = this.damageTable[toAttack] || (this.damageTable[toAttack] = []);
        damages.push({
          from: name,
          damage: damage,
          aoe: false
        });
      }

      if (++this.attackCount >= this.alive) {
        this.attackCount = 0;
        var damageTable = this.damageTable;
        this.damageTable = new Array(playerNumber);
        game.trigger('calc', [this.id, damageTable]);
      }
    });
  };

  /**
   *
   * @param {object[]} damageTable
   */
  Observer.prototype.calc = function (damageTable) {
    /** 记录本回合结束时尚存活的玩家 */
    var survive = [];
    /** 记录本回合该队受到的总伤害 */
    var totalDamage = 0;

    for (var i = 0; i < playerNumber; i++) {
      var damages = damageTable[i];
      /** 只计算存活的玩家收到的伤害（容错） */
      if (this.team[i] && damages !== undefined) {
        var player = this.team[i];
        for (var j = 0, len = damages.length; j < len; j++) {
          var damage = damages[j];
          /** 群体技能闪避率提高50% */
          var missBuf = damage.aoe ? 1.5 : 1;
          /**
           * 由于闪避成功的判定题目中表述并不明确，
           * 此处先随机生成介于[10, 30]或[15, 45]的闪避率，
           * 然后通过该随机的闪避率生成随机 boolean 值判定。
           */
          var missRate = Util.randomInteger(10 * missBuf, 30 * missBuf);
          var isMiss = Util.randomBoolean(missRate, 100 - missRate);

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
      }
    }
      /** 输出本回合本队受到的总伤害 */
//    totalDamage > 0 && console.info('\t' + this.name + ': in turn ' + game.turn + ' Team ' + (this.id === 0 ? 'A' : 'B') + ' got ' + totalDamage + ' damage.');
    if (this.alive === 0) {
      /** 玩家全部阵亡，报告 beaten 事件 */
      game.trigger('beaten', [this.id]);
    }

    /** 回合结束，报告 ready 状态，并提供存活玩家名单与另一位 OB 交换 */
    game.trigger('ready', [this.id, survive]);
  };

  /**
   * Player的构造函数，初始化玩家信息
   * @constructor
   * @class Player Player
   * @classdesc Player类，记录玩家信息和血量、技能冷却时间
   */
  var Player = VS.Player = function Player(id, observer) {
    this.id = id;
    this.name = (observer.id === 0 ? 'A' : 'B') + id;
    this.observer = observer;

    this.hp = 100;
    this.cd = 0;
  };

  /**
   * 玩家进行攻击
   */
  Player.prototype.attack = function () {
    if (this.cd > 0) {
      this.observer.trigger('skip');
      this.cd--;
      return;
    }

    var damage;
    var attackRange = this.observer.attackRange;
    if (attackRange.length === 1 || Util.randomBoolean(4, 1)) {
      /** 单体攻击 */
      damage = Util.randomInteger(10, 15);
      this.cd = damage;
      var toAttack = attackRange[Util.randomInteger(0, attackRange.length - 1)];
      this.observer.trigger('attack', [this.name, damage, toAttack]);
    }
    else {
      /** 群体攻击 */
      damage = Util.randomInteger(5, 10);
      /** 群体攻击冷却时间加倍 */
      this.cd = damage * 2;
      Util.console.log(this.name + '使用群攻攻击', 'blue');
      this.observer.trigger('attack', [this.name, damage]);
    }
  };

  var UI = VS.UI = {
    /**
     * 输出帮助信息
     */
    printHelp: function () {
      Util.console.title('混战PK模拟器');
      Util.console.log('快捷键：');
      Util.console.log('\tA 切换自动运行    T 设置回合时间    C 清空控制台');
      Util.console.log('\tH 帮助    Enter/Space 开始    → 下一回合');
      Util.console.log('输出说明：');
      Util.console.log('\t紫色：单体攻击', 'purple');
      Util.console.log('\t蓝色：群体攻击', 'blue');
      Util.console.log('\t黄色：被攻击对象血量少于30', 'yellow');
      Util.console.log('\t灰色：攻击被躲避', 'grey');
      Util.console.log('\t红色：HP减为0', 'red');
    }
  };

  /** 处理 UI 事件 */
  var document = window.document;
  window.addEventListener('load', function () {
    Util.extend(UI, {
      autoplay: document.querySelector('#autoplay'),
      duration: document.querySelector('#duration'),
      start: document.querySelector('#start'),
      next: document.querySelector('#next')
    });
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
        case 13:
        case 32: {
          if (!UI.start.disabled) {
            UI.duration.blur();
            startHandler();
          }
          break;
        }
        case 65: {
          UI.autoplay.checked = !UI.autoplay.checked;
          break;
        }
        case 67: {
          console.clear();
          UI.printHelp();
          break;
        }
        case 72: {
          UI.printHelp();
          break;
        }
        case 84: {
          UI.duration.focus();
          event.preventDefault();
          break;
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

  /** 程序开始 */
  UI.printHelp();

  game = new Game();
})();
