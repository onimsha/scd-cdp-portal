import { observable, decorate } from "mobx"
import * as Blockchain from "../blockchainHandler";

import { toBigNumber, fromWei, toWei, wmul, wdiv, fromRaytoWad, WAD, toBytes32, addressToBytes32, methodSig, isAddress } from '../helpers';

const settings = require('../settings');

class SystemStore {
  network = null;
  profile = null;
  tub = null;
  top = null;
  tap = null;
  vox = null;
  pit = null;
  gem = null;
  gov = null;
  skr = null;
  dai = null;
  sin = null;
  pip = null;
  pep = null;

  constructor() {
    this.getInitialState();
  }

  getInitialState = () => {
    this.tub = {
      address: null,
      authority: null,
      eek: 'undefined',
      safe: 'undefined',
      off: -1,
      out: -1,
      axe: toBigNumber(-1),
      mat: toBigNumber(-1),
      cap: toBigNumber(-1),
      fit: toBigNumber(-1),
      tax: toBigNumber(-1),
      fee: toBigNumber(-1),
      chi: toBigNumber(-1),
      rhi: toBigNumber(-1),
      rho: toBigNumber(-1),
      gap: toBigNumber(-1),
      tag: toBigNumber(-1),
      per: toBigNumber(-1),
      avail_boom_skr: toBigNumber(-1),
      avail_boom_dai: toBigNumber(-1),
      avail_bust_skr: toBigNumber(-1),
      avail_bust_dai: toBigNumber(-1),
      cups: {},
      cupId: null,
      cupsLoading: true,
      cupsCount: 0,
      cupsPage: 1,
      legacyCups: {}
    };
    this.top = {
      address: null,
    };
    this.tap = {
      address: null,
      fix: toBigNumber(-1),
      gap: toBigNumber(-1),
    };
    this.vox = {
      address: null,
      era: toBigNumber(-1),
      tau: toBigNumber(-1),
      par: toBigNumber(-1),
      way: toBigNumber(-1),
    };
    this.pit = {
      address: null,
    };
    this.gem = {
      address: null,
      totalSupply: toBigNumber(-1),
      myBalance: toBigNumber(-1),
      tubBalance: toBigNumber(-1),
      tapBalance: toBigNumber(-1),
    };
    this.gov = {
      address: null,
      totalSupply: toBigNumber(-1),
      myBalance: toBigNumber(-1),
      pitBalance: toBigNumber(-1),
    };
    this.skr = {
      address: null,
      totalSupply: toBigNumber(-1),
      myBalance: toBigNumber(-1),
      tubBalance: toBigNumber(-1),
      tapBalance: toBigNumber(-1),
    };
    this.dai = {
      address: null,
      totalSupply: toBigNumber(-1),
      myBalance: toBigNumber(-1),
      tapBalance: toBigNumber(-1),
    };
    this.sin = {
      address: null,
      totalSupply: toBigNumber(-1),
      tubBalance: toBigNumber(-1),
      tapBalance: toBigNumber(-1),
      // This field will keep an estimated value of new sin which is being generated due the 'stability/issuer fee'.
      // It will return to zero each time 'drip' is called
      issuerFee: toBigNumber(0),
    };
    this.pip = {
      address: null,
      val: toBigNumber(-1),
    };
    this.pep = {
      address: null,
      val: toBigNumber(-1),
    };
  }

  loadEraRho = () => {
    const promises = [
                      this.getParameterFromTub('rho'),
                      this.getParameterFromVox('era')
                      ];
    Promise.all(promises).then(r => {
      if (r[0] === true && r[1] === true && this.tub.tax.gte(0) && this.sin.tubBalance.gte(0)) {
        this.sin.issuerFee = this.sin.tubBalance.times(fromWei(this.tub.tax).pow(this.vox.era.minus(this.tub.rho))).minus(this.sin.tubBalance).round(0);
      }
    });
  }

  getParameterFromTub = (field, ray = false, callback = false) => {
    return new Promise((resolve, reject) => {
      Blockchain.objects.tub[field].call((e, value) => {
        if (!e) {
          this.tub[field] = ray ? fromRaytoWad(value) : value;
          this.getBoomBustValues();
          const promises = [];
          Object.keys(this.tub.cups).map(key =>
            promises.push(this.addExtraCupData(this.tub.cups[key]))
          );
          Promise.all(promises).then(r => {
            if (r.length > 0) {
              for (let i = 0; i < r.length; i++) {
                if (typeof this.tub.cups[r[i].id] !== 'undefined') {
                  this.tub.cups[r[i].id].pro = r[i].pro;
                  this.tub.cups[r[i].id].ratio = r[i].ratio;
                  this.tub.cups[r[i].id].avail_dai = r[i].avail_dai;
                  this.tub.cups[r[i].id].avail_dai_with_margin = r[i].avail_dai_with_margin;
                  this.tub.cups[r[i].id].avail_skr = r[i].avail_skr;
                  this.tub.cups[r[i].id].avail_skr_with_margin = r[i].avail_skr_with_margin;
                  this.tub.cups[r[i].id].liq_price = r[i].liq_price;
                  this.tub.cups[r[i].id].safe = r[i].safe;
                }
              }
            }
          });
          if (callback) {
            callback(value);
          }
          resolve(this.tub[field]);
        } else {
          reject(e);
        }
      });
    });
  }

  getParameterFromTap = (field, ray = false) => {
    const p = new Promise((resolve, reject) => {
      Blockchain.objects.tap[field].call((e, value) => {
        if (!e) {
          this.tap[field] = ray ? fromRaytoWad(value) : value;
          resolve(this.tap[field]);
        } else {
          reject(e);
        }
      });
    });
    return p;
  }

  getParameterFromVox = (field, ray = false) => {
    const p = new Promise((resolve, reject) => {
      Blockchain.objects.vox[field].call((e, value) => {
        if (!e) {
          this.vox[field] = ray ? fromRaytoWad(value) : value;
          resolve(this.vox[field]);
        } else {
          reject(e);
        }
      });
    });
    return p;
  }

  getValFromFeed = (obj) => {
    const p = new Promise((resolve, reject) => {
      Blockchain.objects[obj].peek.call((e, r) => {
        if (!e) {
          this[obj].val = toBigNumber(r[1] ? parseInt(r[0], 16) : -2);
          this.getBoomBustValues();
          resolve(this[obj].val);
        } else {
          reject(e);
        }
      });
    });
    return p;
  }

  getBoomBustValues = () => {
    if (this.dai.tapBalance.gte(0)
    //&& this.sin.issuerFee.gte(0)
    && this.sin.tapBalance.gte(0)
    && this.vox.par.gte(0)
    && this.tub.tag.gte(0)
    && this.tap.gap.gte(0)
    && this.pip.val.gte(0)
    && this.skr.tapBalance.gte(0)
    && this.sin.tubBalance.gte(0)
    && this.tub.tax.gte(0)
    && this.skr.tapBalance.gte(0)
    && this.skr.totalSupply.gte(0)
    && this.gem.tubBalance.gte(0)) {
      // const dif = this.dai.tapBalance.add(this.sin.issuerFee).minus(this.sin.tapBalance); bust & boom don't execute drip anymore so we do not need to do the estimation
      const dif = this.dai.tapBalance.minus(this.sin.tapBalance);
      this.tub.avail_boom_dai = this.tub.avail_boom_skr = toBigNumber(0);
      this.tub.avail_bust_dai = this.tub.avail_bust_skr = toBigNumber(0);

      // if higher or equal, it means vox.par is static or increases over the time
      // if lower, it means it decreases over the time, so we calculate a future par (in 10 minutes) to reduce risk of tx failures
      const futurePar = this.vox.way.gte(WAD) ? this.vox.par : this.vox.par.times(fromWei(this.vox.way).pow(10*60));

      if (dif.gt(0)) {
        // We can boom
        this.tub.avail_boom_dai = dif;
        this.tub.avail_boom_skr = wdiv(wdiv(wmul(this.tub.avail_boom_dai, futurePar), this.tub.tag), WAD.times(2).minus(this.tap.gap));
      }

      if (this.skr.tapBalance.gt(0) || dif.lt(0)) {
        // We can bust

        // This is a margin we need to take into account as bust quantity goes down per second
        // const futureFee = this.sin.tubBalance.times(fromWei(this.tub.tax).pow(120)).minus(this.sin.tubBalance).round(0); No Drip anymore!!!
        // const daiNeeded = dif.abs().minus(futureFee);
        const daiNeeded = dif.gte(0) ? toBigNumber(0) : dif.abs();
        const equivalentSKR = wdiv(wdiv(wmul(daiNeeded, futurePar), this.tub.tag), this.tap.gap);

        if (this.skr.tapBalance.gte(equivalentSKR)) {
          this.tub.avail_bust_skr = this.skr.tapBalance;
          this.tub.avail_bust_ratio = wmul(wmul(wdiv(WAD, this.vox.par), this.tub.tag), this.tap.gap);
          this.tub.avail_bust_dai = wmul(this.tub.avail_bust_skr, this.tub.avail_bust_ratio);
        } else {
          this.tub.avail_bust_dai = daiNeeded;
          // We need to consider the case where PETH needs to be minted generating a change in 'this.tub.tag'
          this.tub.avail_bust_skr = wdiv(this.skr.totalSupply.minus(this.skr.tapBalance), wdiv(wmul(wmul(this.pip.val, this.tap.gap), this.gem.tubBalance), wmul(this.tub.avail_bust_dai, this.vox.par)).minus(WAD));
          this.tub.avail_bust_ratio = wdiv(this.tub.avail_bust_dai, this.tub.avail_bust_skr);
        }
      }
    }
  }

  calculateSafetyAndDeficit = () => {
    if (this.tub.mat.gte(0) && this.skr.tubBalance.gte(0) && this.tub.tag.gte(0) && this.sin.totalSupply.gte(0)) {
      const pro = wmul(this.skr.tubBalance, this.tub.tag);
      const con = this.sin.totalSupply;
      this.tub.eek = pro.lt(con);

      const min = wmul(con, this.tub.mat);
      this.tub.safe = pro.gte(min);
    }
  }

  getFromService = (service, conditions = {}, sort = {}, limit = null) => {
    const p = new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let conditionsString = '';
      let sortString = '';
      Object.keys(conditions).map(key => {
        conditionsString += `${key}:${conditions[key]}`;
        conditionsString += Object.keys(conditions).pop() !== key ? '&' : '';
        return false;
      });
      conditionsString = conditionsString !== '' ? `/conditions=${conditionsString}` : '';
      Object.keys(sort).map(key => {
        sortString += `${key}:${sort[key]}`;
        sortString += Object.keys(sort).pop() !== key ? '&' : '';
        return false;
      });
      sortString = sortString !== '' ? `/sort=${sortString}` : '';
      const url = `${settings.chain[this.network.network].service}${settings.chain[this.network.network].service.slice(-1) !== '/' ? '/' : ''}${service}${conditionsString}${sortString}${limit ? `/limit=${limit}` : ''}`;
      xhr.open('GET', url, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
          reject(xhr.status);
        }
      }
      xhr.send();
    });
    return p;
  }

  getCup = (id) => {
    return new Promise((resolve, reject) => {
      Blockchain.objects.tub.cups.call(toBytes32(id), (e, cupData) => {
        if (!e) {
          let cupBaseData = {
            id: parseInt(id, 10),
            lad: cupData[0],
            ink: cupData[1],
            art: cupData[2],
            ire: cupData[3],
          };
  
          Promise.resolve(this.addExtraCupData(cupBaseData)).then(cup => {
            resolve(cup);
          }, e => {
            reject(e);
          });
        } else {
          reject(e);
        }
      });
    });
  }

  getMyCups = () => {
    if (this.profile.proxy) {
      this.tub.cupsLoading = true;
      this.getCups('new');
    }
  }

  getCups = (type) => {
    const lad = type === 'new' ? this.profile.proxy : this.network.defaultAccount;
    const me = this;
    if (settings.chain[this.network.network].service) {
      Promise.resolve(this.getFromService('cups', {lad}, {cupi: 'asc'})).then(response => {
        const promises = [];
        response.results.forEach(v => {
          promises.push(me.getCup(v.cupi));
        });
        me.getCupsFromChain(type, response.lastBlockNumber, promises);
      }).catch(error => {
        me.getCupsFromChain(type, settings.chain[this.network.network].fromBlock);
      });
    } else {
      this.getCupsFromChain(type, settings.chain[this.network.network].fromBlock);
    }
  }
  
  getCupsFromChain = (type, fromBlock, promises = []) => {
    const lad = type === 'new' ? this.profile.proxy : this.network.defaultAccount;
    const conditions = {lad};
    const promisesLogs = [];
    promisesLogs.push(
      new Promise((resolve, reject) => {
        Blockchain.objects.tub.LogNewCup(conditions, {fromBlock}).get((e, r) => {
          if (!e) {
            for (let i = 0; i < r.length; i++) {
              promises.push(this.getCup(parseInt(r[i].args.cup, 16)));
            }
            resolve();
          } else {
            reject(e);
          }
        });
      })
    );
    promisesLogs.push(
      new Promise((resolve, reject) => {
        Blockchain.objects.tub.LogNote({sig: methodSig('give(bytes32,address)'), bar: toBytes32(conditions.lad)}, {fromBlock}).get((e, r) => {
          if (!e) {
            for (let i = 0; i < r.length; i++) {
              promises.push(this.getCup(parseInt(r[i].args.foo, 16)));
            }
            resolve();
          } else {
            reject(e);
          }
        });
      })
    );
    Promise.all(promisesLogs).then(r => {
      conditions.closed = false;
      if (type === 'legacy' || this.tub.cupsLoading) {
        Promise.all(promises).then(cups => {
          const cupsFiltered = {};
          for (let i = 0; i < cups.length; i++) {
            if (conditions.lad === cups[i].lad) {
                cupsFiltered[cups[i].id] = cups[i];
            }
          }
          const keys = Object.keys(cupsFiltered).sort((a, b) => a - b);
          if (type === 'new') {
            if (this.tub.cupsLoading) {
              this.tub.cupsLoading = false;
              this.tub.cups = cupsFiltered;
              if (keys.length > 0 && settings.chain[this.network.network].service) {
                keys.forEach(key => {
                  Promise.resolve(this.getFromService('cupHistoryActions', {cupi: key}, {timestamp:'asc'})).then(response => {
                    this.tub.cups[key].history = response.results
                    this.calculateCupChart();
                  }, () => {});
                });
              }
            }
          } else if (type === 'legacy') {
            this.tub.legacyCups = cupsFiltered;
          }
        });
      }
    });
  }

  addExtraCupData = (cup) => {
    cup = this.calculateCupData(cup);
    return new Promise((resolve, reject) => {
      Blockchain.objects.tub.safe['bytes32'].call(toBytes32(cup.id), (e, safe) => {
        if (!e) {
          cup.safe = safe;
          resolve(cup);
        } else {
          reject(e);
        }
      });
    });
  }

  calculateCupData = (cup) => {
    cup.pro = wmul(cup.ink, this.tub.tag).round(0);
    cup.ratio = cup.pro.div(wmul(this.tab(cup), this.vox.par));
    // This is to give a window margin to get the maximum value (as 'chi' is dynamic value per second)
    const marginTax = fromWei(this.tub.tax).pow(120);
    cup.avail_dai = wdiv(cup.pro, wmul(this.tub.mat, this.vox.par)).minus(this.tab(cup)).round(0).minus(1); // "minus(1)" to avoid rounding issues when dividing by mat (in the contract uses it mulvoxlying on safe function)
    cup.avail_dai_with_margin = wdiv(cup.pro, wmul(this.tub.mat, this.vox.par)).minus(this.tab(cup).times(marginTax)).round(0).minus(1);
    cup.avail_dai_with_margin = cup.avail_dai_with_margin.lt(0) ? toBigNumber(0) : cup.avail_dai_with_margin;
    cup.avail_skr = cup.ink.minus(wdiv(wmul(wmul(this.tab(cup), this.tub.mat), this.vox.par), this.tub.tag)).round(0);
    cup.avail_skr_with_margin = cup.ink.minus(wdiv(wmul(wmul(this.tab(cup).times(marginTax), this.tub.mat), this.vox.par), this.tub.tag)).round(0);
    cup.avail_skr_with_margin = cup.avail_skr_with_margin.lt(0) ? toBigNumber(0) : cup.avail_skr_with_margin;
    cup.liq_price = cup.ink.gt(0) && cup.art.gt(0) ? wdiv(wdiv(wmul(this.tab(cup), this.tub.mat), this.tub.per), cup.ink) : toBigNumber(0);
    return cup;
  }

  reloadCupData = (id) => {
    Promise.resolve(this.getCup(id).then(cup => {
      console.log('getCup in reload', cup);
      this.tub.cups[id] = {...cup};
      if (settings.chain[this.network.network].service) {
        Promise.resolve(this.getFromService('cupHistoryActions', {cupi: id}, {timestamp:'asc'})).then(response => {
          this.tub.cups[id].history = response.results;
        }, () => {});
      }
    }));
  }

  changeCup = (e) => {
    e.preventDefault();
    this.tub.cupId = e.target.getAttribute('data-cupId');
    // this.calculateCupChart();
  }

  tab = (cup) => {
    return wmul(cup.art, this.tub.chi).round(0);
  }
  
  rap = (cup) => {
    return wmul(cup.ire, this.tub.rhi).minus(this.tab(cup)).round(0);
  }

  setUpToken = (token) => {
    Blockchain.objects.tub[token.replace('dai', 'sai')].call((e, r) => {
      if (!e) {
        this[token].address = r;
        Blockchain.loadObject(token === 'gem' ? 'dsethtoken' : 'dstoken', r, token);
        this.getDataFromToken(token);
        this.setFilterToken(token);
      }
    })
  }
  
  getDataFromToken = (token) => {
    this.getTotalSupply(token);
  
    if (token !== 'sin' && isAddress(this.network.defaultAccount)) {
      this.getBalanceOf(token, this.network.defaultAccount, 'myBalance');
    }
    if (token === 'gem' || token === 'skr' || token === 'sin') {
      this.getBalanceOf(token, this.tub.address, 'tubBalance');
    }
    if (token === 'gem' || token === 'skr' || token === 'dai' || token === 'sin') {
      this.getBalanceOf(token, this.tap.address, 'tapBalance');
      this.getBoomBustValues();
    }
    if (token === 'gem' || token === 'skr') {
      this.getParameterFromTub('per', true);
    }
    if (token === 'gov') {
      this.getBalanceOf(token, this.pit.address, 'pitBalance');
    }
  }
  
  getTotalSupply = (token) => {
    Blockchain.objects[token].totalSupply.call((e, r) => {
      if (!e) {
        this[token].totalSupply = r;
        if (token === 'sin') {
          this.calculateSafetyAndDeficit();
        }
      }
    })
  }
  
  getBalanceOf = (token, address, field) => {
    Blockchain.objects[token].balanceOf.call(address, (e, r) => {
      if (!e) {
        this[token][field] = r;
        if ((token === 'skr' || token === 'dai') && field === 'tubBalance') {
          this.calculateSafetyAndDeficit();
        }
      }
    })
  }

  setFilterToken = (token) => {
    const filters = ['Transfer', 'Approval'];
  
    if (token === 'gem') {
      filters.push('Deposit');
      filters.push('Withdrawal');
    } else {
      filters.push('Mint');
      filters.push('Burn');
    }
  
    for (let i = 0; i < filters.length; i++) {
      const conditions = {};
      if (Blockchain.objects[token][filters[i]]) {
        Blockchain.objects[token][filters[i]](conditions, {fromBlock: 'latest'}, (e, r) => {
          if (!e) {
            this.transactions.logTransactionConfirmed(r.transactionHash);
            this.getDataFromToken(token);
          }
        });
      }
    }
  }

  // Actions
  checkAllowance = (token, callbacks) => {
    Blockchain.getAllowance(token, this.network.defaultAccount, this.profile.proxy).then(r => {
      const valueObj = toBigNumber(2).pow(256).minus(1); // uint(-1)

      if (r.equals(valueObj)) {
        callbacks.forEach(callback => this.executeCallback(callback));
      } else {
        const tokenName = token.replace('gem', 'weth').replace('gov', 'mkr').replace('skr', 'peth').toUpperCase();
        const id = Math.random();
        const title = `${tokenName}: approve`;
        this.transactions.logRequestTransaction(id, title);
        Blockchain.objects[token].approve(this.profile.proxy, -1, {}, (e, tx) => this.log(e, tx, id, title, callbacks));
      }
    }, () => {});
  }
  
  transferToken = (token, to, amount) => {
    const tokenName = token.replace('gov', 'mkr').toUpperCase();
    const id = Math.random();
    const title = `${tokenName}: transfer ${to} ${amount}`;
    this.transactions.logRequestTransaction(id, title);
    const log = (e, tx) => {
      if (!e) {
        this.transactions.logPendingTransaction(id, tx, title, [['system/setUpToken', token]]);
      } else {
        console.log(e);
        this.transactions.logTransactionRejected(id, title);
      }
    }
    Blockchain.objects[token].transfer(to, toWei(amount), {}, log);
  }

  saiProxyAddr = () => {
    return settings.chain[this.network.network].proxyContracts.sai
  }
  
  open = () => {
    const id = Math.random();
    const title = 'Open CDP';
    this.transactions.logRequestTransaction(id, title);
    Blockchain.objects.proxy.execute['address,bytes'](
      this.saiProxyAddr(),
      `${methodSig(`open()`)}`,
      (e, tx) => this.transactions.log(e, tx, id, title, [['system/getMyCups']])
    );  
  }
  
  shut = (cup) => {
    const id = Math.random();
    const title = `Shut CDP ${cup}`;
    this.transactions.logRequestTransaction(id, title);
    Blockchain.objects.proxy.execute['address,bytes'](
      this.saiProxyAddr(),
      `${methodSig(`shut(bytes32)`)}${toBytes32(cup, false)}`,
      (e, tx) => this.transactions.log(e, tx, id, title, [['system/getMyCups'], ['profile/getAccountBalance'], ['system/setUpToken', 'sai'], ['system/setUpToken', 'sin']])
    );
  }
  
  give = (cup, newOwner) => {
    const id = Math.random();
    const title = `Transfer CDP ${cup} to ${newOwner}`;
    this.transactions.logRequestTransaction(id, title);
    Blockchain.objects.proxy.execute['address,bytes'](
      this.saiProxyAddr(),
      `${methodSig(`give(bytes32, address)`)}${toBytes32(cup, false)}${addressToBytes32(newOwner, false)}`,
      (e, tx) => this.transactions.log(e, tx, id, title, [['system/getMyCups']])
    );
  }
  
  lockAndDraw = (cup, eth, dai) => {
    let action = false;
    let title = '';
  
    if (eth.gt(0) || dai.gt(0)) {
      if (!cup) {
        title = `Lock ${eth.valueOf()} ETH + Draw ${dai.valueOf()} DAI`;
        action = `${methodSig(`lockAndDraw(address,uint256)`)}${addressToBytes32(this.tub.address, false)}${toBytes32(toWei(dai), false)}`;
      } else {
        if (dai.equals(0)) {
          title = `Lock ${eth.valueOf()} ETH`;
          action = `${methodSig(`lock(address,bytes32)`)}${addressToBytes32(this.tub.address, false)}${toBytes32(cup, false)}`;
        } else if (eth.equals(0)) {
          title = `Draw ${dai.valueOf()} DAI`;
          action = `${methodSig(`draw(address,bytes32,uint256)`)}${addressToBytes32(this.tub.address, false)}${toBytes32(cup, false)}${toBytes32(toWei(dai), false)}`;
        } else {
          title = `Lock ${eth.valueOf()} ETH + Draw ${dai.valueOf()} DAI`;
          action = `${methodSig(`lockAndDraw(address,bytes32,uint256)`)}${addressToBytes32(this.tub.address, false)}${toBytes32(cup, false)}${toBytes32(toWei(dai), false)}`;
        }
      }
  
      const id = Math.random();
      this.transactions.logRequestTransaction(id, title);
      Blockchain.objects.proxy.execute['address,bytes'](
        this.saiProxyAddr(),
        action,
        {value: toWei(eth)},
        (e, tx) => this.transactions.log(e, tx, id, title, cup ? [['system/reloadCupData', cup], ['profile/getAccountBalance'], ['system/setUpToken', 'dai'], ['system/setUpToken', 'sin']] : [['system/getMyCups'], ['profile/getAccountBalance'], ['system/setUpToken', 'dai'], ['system/setUpToken', 'sin']])
      );
    }
  }
  
  wipeAndFree = (cup, eth, dai) => {
    let action = false;
    let title = '';
    if (eth.gt(0) || dai.gt(0)) {
      if (dai.equals(0)) {
        title = `Withdraw ${eth.valueOf()} ETH`;
        action = `${methodSig(`free(address,bytes32,uint256)`)}${addressToBytes32(this.tub.address, false)}${toBytes32(cup, false)}${toBytes32(toWei(eth), false)}`;
      } else if (eth.equals(0)) {
        title = `Wipe ${dai.valueOf()} DAI`;
        action = `${methodSig(`wipe(address,bytes32,uint256)`)}${addressToBytes32(this.tub.address, false)}${toBytes32(cup, false)}${toBytes32(toWei(dai), false)}`;
      } else {
        title = `Wipe ${dai.valueOf()} DAI + Withdraw ${eth.valueOf()} ETH`;
        action = `${methodSig(`wipeAndFree(address,bytes32,uint256,uint256)`)}${addressToBytes32(this.tub.address, false)}${toBytes32(cup, false)}${toBytes32(toWei(eth), false)}${toBytes32(toWei(dai), false)}`;
      }
      const id = Math.random();
      this.transactions.logRequestTransaction(id, title);
      Blockchain.objects.proxy.execute['address,bytes'](
        this.saiProxyAddr(),
        action,
        (e, tx) => this.transactions.log(e, tx, id, title, [['system/reloadCupData', cup], ['profile/getAccountBalance'], ['system/setUpToken', 'sai'], ['system/setUpToken', 'sin']])
      );
    }
  }
  
  migrateCDP = async (cup) => {
    // We double check user has a proxy and owns it (transferring a CDP is a very risky action)
    const proxy = this.profile.proxy;
    if (proxy && isAddress(proxy) && await Blockchain.getProxyOwner(proxy) === this.network.defaultAccount) {
      const id = Math.random();
      const title = `Migrate CDP ${cup}`;
      this.transactions.logRequestTransaction(id, title);
      Blockchain.objects.tub.give(toBytes32(cup), proxy, (e, tx) => this.transactions.log(e, tx, id, title, [['system/getMyCups'], ['system/getMyLegacyCups']]));
    }
  }
  
  executeAction = (value) => {
    let callbacks = [];
    let error = false;
    switch (this.dialog.dialog.method) {
      case 'open':
        callbacks = [
                      ['system/open']
                    ];
        break;
      case 'lock':
        callbacks = [
                      ['system/lockAndDraw', this.dialog.dialog.cup, value, toBigNumber(0)]
                    ];
        break;
      case 'draw':
        callbacks = [
                      ['system/lockAndDraw', this.dialog.dialog.cup, toBigNumber(0), value]
                    ];
        break;
      case 'wipe':
        callbacks = [
                      ['system/checkAllowance', 'gov',
                        [
                          ['system/checkAllowance', 'dai',
                            [
                              ['system/wipeAndFree', this.dialog.dialog.cup, toBigNumber(0), value]
                            ]
                          ]
                        ]
                      ]
                    ];
        break;
      case 'free':
        callbacks = [
                      ['system/wipeAndFree', this.dialog.dialog.cup, value, toBigNumber(0)]
                    ];
        break;
      case 'shut':
        callbacks = [
                      ['system/checkAllowance', 'gov',
                        [
                          ['system/checkAllowance', 'dai',
                            [
                              ['system/shut', this.dialog.dialog.cup]
                            ]
                          ]
                        ]
                      ]
                    ];
        break;
      case 'migrate':
        callbacks = [
                      ['system/migrateCDP', this.dialog.dialog.cup]
                    ];
        break;
      default:
        break;
    }
  
    if (error) {
      this.dialog.dialog.error = error;
    } else {
      this.dialog.dialog.show = false;
      this.profile.checkProxy(callbacks);
    }
  }
}

decorate(SystemStore, {
  network: observable,
  profile: observable,
  tub: observable,
  top: observable,
  tap: observable,
  vox: observable,
  pit: observable,
  gem: observable,
  gov: observable,
  skr: observable,
  dai: observable,
  sin: observable,
  pip: observable,
  pep: observable,
});

const store = new SystemStore();
export default store;