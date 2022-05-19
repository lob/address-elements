import { isInternational } from './international-utils.js';

export class Autocomplete {
    constructor(config, element) {
        this.config = config;
        this.query = '';

        element.on('input', (e) => {
            this.query = e.target.value
            this.getAutocompleteSuggestions(suggestions => {
                if (!suggestions) {
                    return;
                }

                const suggestionListItems = this.generateSuggestionListItems(suggestions);
                const currentDropdown = $('#lob-dropdown');

                // Add dropdown UI or replace existing one with latest address suggestions 
                if (currentDropdown.length) {
                    currentDropdown.empty().append(suggestionListItems);
                } else {
                    const dropdownElement = $(`
                      <div id="lob-dropdown" class="lob-dropdown-menu"></div>
                    `)
                    dropdownElement.append(suggestionListItems);
                    element.after(dropdownElement);
                }
            });
        })
    }

    /**
     * query Lob for autocomplete suggestions
     * @param {string} query - what the user just keyed into the autocomplete input
     * @param {Object} config - the state of the address elements script
     * @param {function} cb - callback
     */
    getAutocompleteSuggestions(cb) {
        const { apis, api_key, channel, elements } = this.config;

        this.config.international = isInternational(elements.country);

        if (this.config.international) {
            return false;
        }

        if (this.query.match(/[A-Za-z0-9]/)) {
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
            xhr.onreadystatechange = function() {
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
                address_prefix: this.query,
                city: elements.city.val(),
                zip_code: elements.zip.val(),
                state: elements.state.val(),
                geo_ip_sort: true
            }));
        }
        return false;
    }

    /**
     * Project the chosen suggested address into the UI
     * @param {object} suggestion - as returned from the Lob API
     */
    applySuggestion(suggestion) {
        const { elements } = this.config;
        elements.primary.val(suggestion.primary_line);
        elements.secondary.val('');
        elements.city.val(suggestion.city);
        elements.state.val(suggestion.state.toUpperCase());
        elements.zip.val(suggestion.zip_code);
        // Remove list
        $('#lob-dropdown').remove();
        // Notify user
        this.config.channel.emit('elements.us_autocompletion.selection', { selection: suggestion, form: elements.form[0] });
    }

    // Render functions

    // Highlights the substring of an address' primary line that matches the users input
    formatAddress(address) {
        const { primary_line, city, state, zip_code } = address;

        let boldStopIndex = 0;

        // Progresses cursor (boldStopIndex) through primary line until it no longer matches users input
        this.query.split('').forEach((inputChar) => {
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


        const suggestionItem = $(`
          <div class="lob-suggestion" tabindex="0">
            ${primaryLineElement}
            <span class="lob-light-text">
              ${city},&nbsp;${state.toUpperCase()},&nbsp;${zip_code}
            </span>
          </div>
        `);

        return suggestionItem;
    }

    generateSuggestionListItems(suggestions) {
        const listContainer = $(`
          <div>
            <!-- Header -->
            <div class="lob-label">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1259 602" class="lob-logo">
                <path d="M1063,141c-47.06,0-89,18.33-121,50.78V0H780V338.74C765,222.53,666.88,138,540,138c-137,0-242,101-242,232a235,235,0,0,0,7.7,60H164V0H0V585H307l14.54-112.68C359.94,550,441.74,602,540,602c127.75,0,225.08-83.62,240-200.41V585H930V540.27c31.8,37,77.27,56.73,133,56.73,103,0,196-109,196-228C1259,239,1175,141,1063,141ZM540,450c-45,0-81-36-81-80s36-80,81-80c46,0,81,35,81,80S585,450,540,450Zm475-1c-46,0-83-36-83-80a82.8,82.8,0,0,1,82.6-83h.4c47,0,85,37,85,83C1100,413,1062,449,1015,449Z" fill="#0099d7" data-v-716a89fc=""></path>
              </svg>
              <span class="lob-light-text">Deliverable addresses</span>
              <a href="https://www.lob.com/address-verification?utm_source=autocomplete&amp;utm_medium=vue">
                Learn more
              </a>
            </div>
            <!-- List Suggestions -->
          </div>
        `);

        suggestions.forEach(address => {
          const suggestionListItem =
            this.formatAddress(address)
              .on('click', () => {
                this.applySuggestion(address);
              })
              .on('keypress', e => {
                if(e.key == 'Enter') {
                  this.applySuggestion(address);
                }
              });

          listContainer.append(suggestionListItem)
        });

        return listContainer;
    }
}