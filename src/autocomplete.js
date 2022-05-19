import { isInternational } from './international-utils.js';

// Highlights the substring of an address' primary line that matches the users input
const formatAddress = (address, query) => {
  const { primary_line, city, state, zip_code } = address;

  let boldStopIndex = 0;

  // Progresses cursor (boldStopIndex) through primary line until it no longer matches users input
  query.split('').forEach((inputChar) => {
    if (inputChar.toLowerCase() === primary_line.charAt(boldStopIndex).toLowerCase()) {
      boldStopIndex += 1
    }
  });

  const primaryLineElement =
    boldStopIndex === 0 ? (
      `${primary_line},`
    ) : boldStopIndex === primary_line.length ? (
      `<strong>${primary_line},</strong>`
    ) : (
      `<span>
        <strong>${primary_line.substring(0, boldStopIndex)}</strong>${primary_line.substring(boldStopIndex)},
      </span>`
    );

  
  return `
    <div class="lob-suggestion">
      ${primaryLineElement}
      <span class="lob-light-text">
        ${city},&nbsp;${state.toUpperCase()},&nbsp;${zip_code}
      </span>
    </div>
  `;
}

const generateSuggestionListElements = (suggestions, query) => `
  <!-- Header -->
  <div class="lob-label">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1259 602" class="lob-logo">
      <path d="M1063,141c-47.06,0-89,18.33-121,50.78V0H780V338.74C765,222.53,666.88,138,540,138c-137,0-242,101-242,232a235,235,0,0,0,7.7,60H164V0H0V585H307l14.54-112.68C359.94,550,441.74,602,540,602c127.75,0,225.08-83.62,240-200.41V585H930V540.27c31.8,37,77.27,56.73,133,56.73,103,0,196-109,196-228C1259,239,1175,141,1063,141ZM540,450c-45,0-81-36-81-80s36-80,81-80c46,0,81,35,81,80S585,450,540,450Zm475-1c-46,0-83-36-83-80a82.8,82.8,0,0,1,82.6-83h.4c47,0,85,37,85,83C1100,413,1062,449,1015,449Z" fill="#0099d7" data-v-716a89fc=""></path>
    </svg>
    <span>Deliverable addresses</span>
    <a href="https://www.lob.com/address-verification?utm_source=autocomplete&amp;utm_medium=vue">
      Learn more
    </a>
  </div>
  <!-- List Suggestions -->
  ${suggestions.map(address => formatAddress(address, query)).join('')}
`;

/**
 * query Lob for autocomplete suggestions
 * @param {string} query - what the user just keyed into the autocomplete input
 * @param {Object} config - the state of the address elements script
 * @param {function} cb - callback
 */
const getAutocompleteSuggestions = (query, config, cb) => {
  const { apis, api_key, channel, elements } = config;

  config.international = isInternational(elements.country);

  if (config.international) {
    return false;
  }

  if (query.match(/[A-Za-z0-9]/)) {
    const xhr = new XMLHttpRequest();
    const url = new URL(apis.autocomplete);
    url.searchParams.append('av_integration_origin', window.location.href);
    url.searchParams.append('integration', 'av-elements');
    url.searchParams.append('valid_addresses', 'true');
    url.searchParams.append('case', 'proper');

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (api_key) {
      xhr.setRequestHeader('Authorization', 'Basic ' + btoa(api_key + ':'));
    }
    xhr.onreadystatechange = function () {
      if (this.readyState === XMLHttpRequest.DONE) {
        if (this.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            channel.emit('elements.us_autocompletion.suggestion', { suggestions: data.suggestions, form: elements.form[0] });
            cb(data.suggestions);
          } catch (e) {
            cb(null);
          }
        } else if (this.status === 401) {
          //INVALID API KEY; allow default submission
          console.log('Please sign up on lob.com to get a valid api key.');
          channel.emit('elements.us_autocompletion.error', { code: 401, message: 'Please sign up on lob.com to get a valid api key.', form: elements.form[0] });
          cb(null);
        } else {
          channel.emit('elements.us_autocompletion.error', { code: 500, message: 'Unknown error.', form: elements.form[0] });
          cb(null);
        }
      }
    }
    xhr.send(JSON.stringify({
      address_prefix: query,
      city: elements.city.val(),
      zip_code: elements.zip.val(),
      state: elements.state.val(),
      geo_ip_sort: true
    }));
  }
  return false;
}

export const configureAutocomplete = (element, config) => {
  element.on('input', (e) => {
    const query = e.target.value
    getAutocompleteSuggestions(query, config, (suggestions) => {
      if (!suggestions) {
        return;
      }

      const htmlString = generateSuggestionListElements(suggestions, query).trim();
      const currentDropdown = $('#lob-dropdown');
      
      // Add dropdown UI or replace existing one with latest address suggestions 
      if (currentDropdown.length) {
        currentDropdown[0].innerHTML = htmlString;        
      } else {
        const dropdownElement = document.createElement('div');
        dropdownElement.setAttribute('id', 'lob-dropdown');
        dropdownElement.setAttribute('class', 'lob-dropdown-menu');
        dropdownElement.innerHTML = htmlString;
        element[0].insertAdjacentElement('afterend', dropdownElement);
      }
    });
  })
}