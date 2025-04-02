

// === Player Stat Logic === //
class Player {
  constructor(rootElement) {
    this.root = rootElement;

    this.maxHP = 8;
    this.hp = 8;
    this.lives = 3;

    this.heal = 1;

    this.reduction = 0;
    this.shield = 0;
    this.roll = 0;

    this.primary = { base: 1, bonus: 0 };
    this.secondary = { base: 1, bonus: 0 };

    this.initListeners();
      this.updateDisplay();
    }

  initListeners() {
    // HP
    this.root.querySelector('.hp-increase').addEventListener('click', () => this.changeHP(1));
    this.root.querySelector('.hp-decrease').addEventListener('click', () => this.changeHP(-1));
    this.root.querySelector('.max-hp-increase').addEventListener('click', () => this.changeMaxHP(1));
    this.root.querySelector('.max-hp-decrease').addEventListener('click', () => this.changeMaxHP(-1));
    // Lives
    this.root.querySelector('.life-increase').addEventListener('click', () => this.changeStat('lives', 1));
    this.root.querySelector('.life-decrease').addEventListener('click', () => this.changeStat('lives', -1));

    // DR, Shield, Roll
    ['reduction', 'shield', 'roll', 'heal'].forEach(stat => {
      this.root.querySelector(`.${stat}-increase`).addEventListener('click', () => this.changeStat(stat, 1));
      this.root.querySelector(`.${stat}-decrease`).addEventListener('click', () => this.changeStat(stat, -1));
    });

    // Fix for offense buttons
    const offenseBlock = this.root.querySelector('.damage-section');
    const offenseGroups = offenseBlock.querySelectorAll('.damage-group');

    ['primary', 'secondary'].forEach((type, i) => {
      const group = offenseGroups[i];
      const cells = group.querySelectorAll('.damage-cell');

      ['base', 'bonus'].forEach((key, j) => {
        const cell = cells[j];
        if (!cell) return;

        const buttons = cell.querySelectorAll('button');
        if (buttons.length < 2) return;

        const [incBtn, decBtn] = buttons;

        incBtn.addEventListener('click', () => this.changeDamage(type, key, 1));
        decBtn.addEventListener('click', () => this.changeDamage(type, key, -1));
      });
    });

    const toggleInputs = this.root.querySelectorAll('.info-row input[type="checkbox"]');
    toggleInputs.forEach(cb => {
      cb.addEventListener('change', () => {
        this.updateDisplay();
        if (this.opponent) this.opponent.updateDisplay(); 
      });
    });
  
  }

  changeDamage(type, key, delta) {
    this[type][key] = Math.max(0, this[type][key] + delta);
    this.updateDisplay();
  }

  changeHP(amount) {
    this.hp += amount;

    if (this.hp > this.maxHP) this.hp = this.maxHP;

    if (this.hp <= 0) {
      if (this.lives > 1) {
        this.lives--;
        this.hp = this.maxHP;
      } else {
        this.lives = 0;
        this.hp = 0;
      }
    }

    this.updateDisplay();
  }

  changeMaxHP(amount) { 
    if (amount < 0) {
      this.hp = Math.min(this.hp, this.maxHP + amount);
    } else {
      this.hp = Math.min(this.hp + 1, this.maxHP + amount);  
    }
    this.maxHP += amount;
    if (this.maxHP < 1) {
      this.maxHP = 1;
    }
    this.updateDisplay();
  }

  changeStat(stat, delta) {
    if (stat === "heal") {
      this[stat] = Math.max(1, this[stat] + delta);
    } else {
      this[stat] = Math.max(0, this[stat] + delta);
    }
    this.updateDisplay();
    if (this.opponent) this.opponent.updateDisplay();
  }

  updateDisplay() {
    // Update HP hearts
    const heartSpan = this.root.querySelector('.hearts');
    const hearts = '❤️'.repeat(this.hp) + '🖤'.repeat(this.maxHP - this.hp);
    heartSpan.textContent = `${hearts} (${this.hp}/${this.maxHP})`;

    // Update lives
    this.root.querySelector('.lives').textContent = `💖 × ${this.lives}`;

    // Update reduction, shield, roll
    this.root.querySelector('.heal').textContent = `🌿 × ${this.heal}`;
    this.root.querySelector('.reduction').textContent = `🪨 × ${this.reduction}`;
    this.root.querySelector('.shield').textContent = `🛡️ × ${this.shield}`;
    this.root.querySelector('.roll').textContent = `🎲 × ${this.roll}`;

    ['primary', 'secondary'].forEach((type, i) => {
      const offenseBlock = this.root.querySelector('.damage-section');
      const offenseGroups = offenseBlock.querySelectorAll('.damage-group');
      const group = offenseGroups[i];
    
      if (group) {
        const baseEl = group.querySelector('.damage-value.base');
        const bonusEl = group.querySelector('.damage-value.bonus');
        if (baseEl) baseEl.textContent = this[type].base;
        if (bonusEl) bonusEl.textContent = this[type].bonus;
      }
    
      // Calculate total damage with multiplier
      let total = this[type].base + this[type].bonus;
    
      const infoGroups = this.root.querySelectorAll('.info-section .damage-group');
      const dealGroup = infoGroups[i + 1];
      const dealToggle = dealGroup?.querySelectorAll('.info-row input[type="checkbox"]')[0]; // 1.5x checkbox
    
      if (dealToggle?.checked) {
        total = Math.ceil(total * 1.5);
      }
    
      // Update Deal display
      const dealTotalEl = dealGroup?.querySelectorAll('.info-row .damage-total')[0];
      if (dealTotalEl) dealTotalEl.textContent = total;
    
      // Update opponent's Receive value (using unmodified opponent's ½ toggle)
      if (this.opponent) {
        const oppInfoGroups = this.opponent.root.querySelectorAll('.info-section .damage-group');
        const oppGroup = oppInfoGroups[i + 1];
        const receiveTotalEl = oppGroup?.querySelectorAll('.info-row .damage-total')[1];
    
        if (receiveTotalEl) {
          let received = Math.max(0, total - this.opponent.reduction);
    
          // Check if opponent has ½ toggle enabled
          const halfToggle = oppGroup.querySelectorAll('.info-row input[type="checkbox"]')[1];
          if (halfToggle?.checked) {
            received = Math.floor(received / 2);
          }
    
          receiveTotalEl.textContent = received;
        }
      }
    });
  }

  setOpponent(opponentPlayer) {
    this.opponent = opponentPlayer;
  }

  reset() {
    this.maxHP = 8;
    this.hp = 8;
    this.lives = 3;
    this.reduction = 0;
    this.shield = 0;
    this.roll = 0;
    this.primary = { base: 1, bonus: 0 };
    this.secondary = { base: 1, bonus: 0 };
    this.updateDisplay();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  resetGame();
});




function resetGame() {
  const players = Array.from(document.querySelectorAll('.player')).map(p => new Player(p));
  if (players.length === 2) {
    players[0].setOpponent(players[1]);
    players[1].setOpponent(players[0]);

    players[0].updateDisplay();
    players[1].updateDisplay();
  }
}
