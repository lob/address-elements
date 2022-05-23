import { findValue } from './form-detection.js';

function resolveInlineStyle(config, type, subtype) {
  return findValue(type + '-' + subtype) || config.styles[type + '-' + subtype];
}

const resolveInputDisplay = config => {
  const display = config.elements.primary.css('display');
  return display.toLowerCase() === 'block' ? 'block' : '';
}

const resolveInputWidth = config => {
  const display = config.elements.primary.css('display');
  if (display.toLowerCase() === 'block') {
    return '100%';
  } else {
    return config.elements.primary.css('width') || (config.elements.primary.outerWidth() + 'px');
  }
}

export const createAutocompleteStyles = config => `  
  .lob-dropdown-menu {
    box-sizing: border-box;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.08);
    border: 1px solid ${resolveInlineStyle(config, 'suggestion', 'bordercolor')};
    border-radius: 0 0 .25rem .25rem;
    border-top: 0;
    background-color: ${resolveInlineStyle(config, 'suggestion', 'bgcolor')};
    display: ${resolveInputDisplay(config)};
    vertical-align: middle;
    overflow-x: hidden;
    overflow-y: scroll;
    position: absolute;
    margin-top: 0.5rem;
    max-height: 400px;
    width: ${resolveInputWidth(config)};
  }

  .lob-label {
    align-items: center;
    border-bottom: 1px solid #DDDDDD;
    cursor: pointer;
    display: flex;
    font-size: 17px;
    padding: 1rem;
  }

  .lob-label > a {
    font-weight: 600;
    color: #0699D6;
    text-decoration: inherit;
    margin-left: 12px;
  }

  .lob-label > span {
    flex: 1;
    margin-left: 12px;
    margin-top: auto;
  }

  .lob-logo {
    height: 21px;
  }

  .lob-suggestion {
    cursor: pointer;
    padding: 12px;
    color: ${resolveInlineStyle(config, 'suggestion', 'color')};
  }

  .lob-suggestion:hover,
  .lob-suggestion:active,
  .lob-suggestion:focus-visible {
    color: ${resolveInlineStyle(config, 'suggestion', 'activecolor')};
    background-color: ${resolveInlineStyle(config, 'suggestion', 'activebgcolor')};
  }

  .lob-suggestion div {
    white-space: nowrap !important;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lob-suggestion span {
    font-size: .8em;
  }

  .lob-light-text {
    color: #888888;
  }
`;

export const createVerifyMessageStyles = config => `
  .lob-verify-message {
    background-color: ${resolveInlineStyle(config, 'err', 'bgcolor')};
    border-radius: .25rem;
    color: ${resolveInlineStyle(config, 'err', 'color')};
    display: none;
    left: 50%;
    margin-bottom: 1.5rem;
    margin-right: -50%;
    margin-top: 1.5rem;
    max-width: 100%;
    padding: .5rem;
    position: relative;
    text-align: center;
    transform: translate(-50%, 0%);
    width: 100%;
  }
`;
