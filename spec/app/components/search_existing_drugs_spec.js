require('../spec_helper');

describe('SearchExistingDrugs', function() {
  const baseApiUrl = 'http://example.com';
  const search = 'wat';
  const existingDrugs = [{searchString: 'ibuprofen', name: 'IBUPROFEN'}, {searchString: 'water', name: 'WATER'}];
  const drugNames = ['water', 'coffee', 'advil', 'water lilies', 'angkor wat'];

  var subject, callbackSpy, context;
  const errors = {existingDrugs: null, newDrug: null};
  beforeEach(function() {
    var SearchExistingDrugs = require('../../../app/components/search_existing_drugs');
    callbackSpy = jasmine.createSpy('callback');
    var $application = new Cursor({search, existingDrugs, errors}, callbackSpy);

    var TrieSearch = require('trie-search');
    var trie = new TrieSearch('name');
    drugNames.forEach(name => trie.add({name}));

    context = withContext({config: {baseApiUrl}, trie}, {$application}, function() {
      var {$application} = this.props;
      return (<SearchExistingDrugs {...{$application}} ref="subject"/>);
    }, root);
    subject = context.refs.subject;
  });

  it('displays the autocomplete list', function() {
    expect('.autocomplete-list').toExist();
    expect('.autocomplete-item').toHaveLength(3);
  });

  describe('when clicking on an autocomplete item', function() {
    beforeEach(function() {
      spyOn(subject, 'search').and.returnValue(new Deferred());
      $('.autocomplete-item:eq(0)').simulate('click');
    });

    it('updates the cursor', function() {
      expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({search: 'water', existingDrugs}));
    });

    describe('after some time has passed', function() {
      beforeEach(function() {
        jasmine.clock().tick(1);
      });

      it('calls search', function() {
        expect(subject.search).toHaveBeenCalled();
      });
    });
  });

  describe('when submitting the search', function() {
    beforeEach(function() {
      spyOn(subject, 'search').and.returnValue(Promise.resolve(search.toUpperCase()));
      $('.form-inline').simulate('submit');
      MockPromises.executeForResolvedPromises();
    });

    it('updates the cursor', function() {
      expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({search: '', existingDrugs: existingDrugs.concat({searchString: search, name: search.toUpperCase()})}));
    });
  });

  describe('when adding a drug that is already in the list', function(){
    beforeEach(function() {
      spyOn(subject, 'search').and.returnValue(Promise.resolve(existingDrugs[0].name));
      $('.form-inline').simulate('submit');
      MockPromises.executeForResolvedPromises();
    });

    it('updates the cursor with an error', function() {
      expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({errors: {existingDrugs: jasmine.any(String), newDrug: null}}));
    });
  });

  describe('when there are already 5 drugs in the list', function() {
    const existingDrugs = ['ibuprofen', 'water', 'coffee', 'morphine', 'claritin']
      .map(searchString => ({searchString, name: searchString.toUpperCase()}));
    beforeEach(function() {
      var $application = new Cursor({search, existingDrugs, errors}, callbackSpy);
      context.setProps({$application});
    });

    describe('when adding another drug', function() {
      beforeEach(function() {
        spyOn(subject, 'search').and.returnValue(Promise.resolve('prozac'));
        $('.form-inline').simulate('submit');
        MockPromises.executeForResolvedPromises();
      });

      it('updates the cursor with an error', function() {
        expect(callbackSpy).toHaveBeenCalledWith(jasmine.objectContaining({errors: {existingDrugs: jasmine.any(String), newDrug: null}}));
      });
    });
  });
});