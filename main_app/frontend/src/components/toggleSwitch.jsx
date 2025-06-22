import React from "react";
import Switch from "react-switch";

import "./styles/toggleSwitch.css";

const SwitchWrapper = ({ isOn, handleToggle, leftLabel, rightLabel }) => {
  return (
    <label>
      <span>{leftLabel}</span>
      <Switch
        onChange={handleToggle}
        checked={isOn}
        className="react-switch"
      />
      <span>{rightLabel}</span>
    </label>
  );
};

export default SwitchWrapper;
