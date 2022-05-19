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

export const createAutocompleteStyles = config =>
    `.algolia-autocomplete {
    display: ${resolveInputDisplay(config)};
    width: ${resolveInputWidth(config)};
    vertical-align: middle;
  }

  .lob-dropdown-menu {
    box-sizing: border-box;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.08);
    border: 1px solid ${resolveInlineStyle(config, 'suggestion', 'bordercolor')};
    border-radius: 0 0 .25rem .25rem;
    border-top: 0;
    background-color: ${resolveInlineStyle(config, 'suggestion', 'bgcolor')};
    overflow-x: hidden;
    overflow-y: scroll;
    margin-top: 0.5rem;
    max-height: 400px;
    width: 100%;
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
  .lob-suggestion:active {
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

// .lob-dropdown-list {
//   background: var(--lob-suggestion-item-background-color);
//   box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.08);
//   border: 1px solid #ddd;
//   border-radius: 4px;
//   max-height: 400px;
//   overflow-y: auto;
//   position: absolute;
//   transform: translateY(.333rem);
//   white-space: nowrap;
//   min-width: 100%;
//   z-index: 9;
// }

// .lob-dropdown-list-item {
//   color: var(--lob-suggestion-item-text-color);
//   cursor: pointer;
//   padding: 0.5rem 1rem;
//   text-align: left;
// }

// .lob-dropdown-list-item-active {
//   background-color: var(--lob-suggestion-item-active-background-color);
// }

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
  }`;