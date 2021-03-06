var {result} = require('../helpers/application_helper');
var Autocomplete = require('../components/autocomplete');
var React = require('react/addons');
var Svg = require('../components/svg');
var DrugLabelMixin = require('../mixins/drug_label_mixin');
var ResponsiveMixin = require('../mixins/responsive_mixin');

var types = React.PropTypes;

const errorMessages = {
  notFound: 'The Medicine name was not found. Please check spelling.',
  duplicate: 'A version of this Medicine has already been selected.',
  tooMany: 'You cannot add more than 5 medicines.'
};

var SearchMixin = {
  mixins: [DrugLabelMixin, ResponsiveMixin],

  propTypes: {
    $application: types.object.isRequired
  },

  contextTypes: {
    trie: types.object
  },

  getInitialState() {
    return {
      requestInProgress: false
    };
  },

  validate(oldResults, name) {
    if (oldResults.length >= 5) {
      return errorMessages.tooMany;
    }

    if(oldResults.find(drug => drug.name === name)) {
      return errorMessages.duplicate;
    }
  },

  updateDrugs(searchString, name) {
    this.props.$application.refine(this.searchCursor).set('');
    var $results = this.props.$application.refine(this.resultsCursor);
    var oldResults = $results.get();
    if(!(oldResults instanceof Array)) {
      $results.set({searchString, name});
      return;
    }

    var error;
    if ((error = this.validate(oldResults, name))) {
      this.props.$application.refine('errors', this.resultsCursor).set(error);
      return;
    }
    $results.push({searchString, name});
  },

  async submit(e) {
    e && e.preventDefault();
    if (!this.isMounted() || this.disabled()) return;
    this.setState({requestInProgress: true});
    var searchString = this.props.$application.get(this.searchCursor);
    try {
      this.updateDrugs(searchString, await this.search(searchString));
    } catch (e) {
      this.props.$application.refine('errors', this.resultsCursor).set(errorMessages.notFound);
    } finally {
      this.setState({requestInProgress: false});
    }
  },

  updateSearch(search) {
    this.props.$application.refine(this.searchCursor).set(search);
    this.props.$application.refine('errors', this.resultsCursor).set(null);
  },

  autocomplete(search) {
    this.updateSearch(search);
    setImmediate(this.submit);
  },

  change(e) {
    this.updateSearch(e.currentTarget.value);
  },

  disabled() {
    var $application = this.props.$application;
    var search = $application.get(this.searchCursor) || '';
    return !search.trim().length;
  },

  render() {
    var {trie} = this.context;
    var $application = this.props.$application;
    var search = $application.get(this.searchCursor) || '';
    var requestInProgress = this.state.requestInProgress;
    var errorMessage = $application.refine('errors').get(this.resultsCursor);
    var flashMessage = errorMessage && (
      <div className="error">
        <Svg src="alert-pill" className="alert-pill"/>
        <span className="error-message">{errorMessage}</span>
      </div>
    );

    var autocompleteProps = {
      placeholder: this.placeholder,
      value: search,
      onChange: this.change,
      disabled: !search || requestInProgress,
      requestInProgress,
      onAutocomplete: this.autocomplete,
      trie
    };

    return (
      <div className={this.className}>
        {flashMessage}
        <form className="form-inline" onSubmit={this.submit}>
          <div className="form-group">
            <label className="search-input-label">
              <span>{this.label}</span>
              <Autocomplete className="search-input" {...autocompleteProps} {...result.call(this, this.autocompleteProps)}/>
            </label>
          </div>
        </form>
      </div>
    );
  }
};

module.exports = SearchMixin;