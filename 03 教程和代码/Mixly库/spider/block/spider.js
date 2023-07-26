'use strict';

goog.provide('Blockly.Blocks.spider');

goog.require('Blockly.Blocks');

Blockly.Blocks.START= {
  init: function() { 
    this.appendDummyInput()
    .appendField("启动蜘蛛");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};
Blockly.Blocks.FOR= {
  init: function() { 
    this.appendDummyInput()
    .appendField("前进");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};
Blockly.Blocks.BACK= {
  init: function() { 
    this.appendDummyInput()
    .appendField("后退");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};
Blockly.Blocks.LEFT= {
  init: function() { 
    this.appendDummyInput()
    .appendField("左转");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};
Blockly.Blocks.RIGHT= {
  init: function() { 
    this.appendDummyInput()
    .appendField("右转");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};
Blockly.Blocks.WAVE= {
  init: function() { 
    this.appendDummyInput()
    .appendField("挥手");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};
Blockly.Blocks.SHAKE= {
  init: function() { 
    this.appendDummyInput()
    .appendField("握手");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};
Blockly.Blocks.DANCE= {
  init: function() { 
    this.appendDummyInput()
    .appendField("跳舞");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};
Blockly.Blocks.SIT= {
  init: function() { 
    this.appendDummyInput()
    .appendField("坐下");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};
Blockly.Blocks.STAND= {
  init: function() { 
    this.appendDummyInput()
    .appendField("站立");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};
Blockly.Blocks.APP= {
  init: function() { 
    this.appendDummyInput()
    .appendField("启动蜘蛛网页APP");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};
Blockly.Blocks.VFOR= {
  init: function() { 
    this.appendDummyInput()
    .appendField("接收到前进指令");
        this.setColour(180);
        this.setOutput(true, null);
        this.setTooltip("");
        this.setHelpUrl("");
  }
};
Blockly.Blocks.VBACK= {
  init: function() { 
    this.appendDummyInput()
    .appendField("接受到后退指令");
    this.setColour(180);
    this.setOutput(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};
Blockly.Blocks.VLEFT= {
  init: function() { 
    this.appendDummyInput()
    .appendField("接收到左转指令");
    this.setColour(180);
    this.setOutput(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};
Blockly.Blocks.VRIGHT= {
  init: function() { 
    this.appendDummyInput()
    .appendField("接收到右转指令");
    this.setColour(180);
    this.setOutput(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};
Blockly.Blocks.VWAVE= {
  init: function() { 
    this.appendDummyInput()
    .appendField("接收到挥手指令");
    this.setColour(180);
    this.setOutput(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};
Blockly.Blocks.VSHAKE= {
  init: function() { 
    this.appendDummyInput()
    .appendField("接收到握手指令");
    this.setColour(180);
    this.setOutput(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};
Blockly.Blocks.VDANCE= {
  init: function() { 
    this.appendDummyInput()
    .appendField("接收到跳舞指令");
    this.setColour(180);
    this.setOutput(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};
Blockly.Blocks.VSIT= {
  init: function() { 
    this.appendDummyInput()
    .appendField("接收到坐下指令");
    this.setColour(180);
    this.setOutput(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};
Blockly.Blocks.VSTAND= {
  init: function() { 
    this.appendDummyInput()
    .appendField("接收到站立指令");
    this.setColour(180);
    this.setOutput(true, null);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};
Blockly.Blocks.KONG= {
  init: function() { 
    this.appendDummyInput()
    .appendField("网页APP开启完成");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};
Blockly.Blocks.break= {
  init: function() { 
    this.appendDummyInput()
    .appendField("跳出break");
  this.setPreviousStatement(true, null);
  this.setColour(180);
  this.setNextStatement(true, null);
  this.setTooltip("");
  this.setHelpUrl("");
  }
};