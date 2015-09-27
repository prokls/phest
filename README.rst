phest
=====

:version:   0.0.1 (testing)
:date:      April 2015
:license:   Public Domain

**Attention! This software is neither stable nor has a useful API!**

Motivation
----------

Extending phridge with Gherkin (yadda) and communication between the browser (pantomjs) and the test runner (mocha).

Personally speaking, we implemented phest to `test <https://github.com/prokls/scratch-html5-tester>`_ a `player <https://github.com/LLK/scratch-html5>`_ written by the MIT team to run `Scratch <http://scratch.mit.edu/>`_ projects inside the browser. This requires good communication between the browser and the test runner, because we can only monkey patch the player to retrieve events. Event handlers cannot be registered in this implementation and we monkey patch core functionality to add event handling.

Is it useful for me?
--------------------

Answer the following questions:

* Do you want to use Gherkin as testcase specification format?
* Do you want to instruct from the client-side Javascript what actions phantomjs shall take (like taking a screenshot)?

If and only both questions are answered with “Yes”, consider using phest in your Javascript application.

Directory structure
-------------------

We suggest to use the following structure (this is the structure of the provided `google` example)::

    ╮
    ├─── google.js
    └──┬ google
       │
       ├──┬ browser
       │  ├──── monkey.js
       │  └──── utils.js
       │
       ├──┬ features
       │  ├──── basic_load.feature
       │  └──── enter_query.feature
       │
       ├──┬ steps
       │  └──── steps.js
       │
       └──┬ utils
          ├──── video-polyfill.js
          └──── audio-polyfill.js

`google.js` in the root directory defines explicitly the various paths. It uses the phest API.
`features` contains Gherkin test cases in a novice-readable way.
`steps` contains the interpretation of those Gherkin elements.
`utils` contains standalone files (like polyfills or libraries) that will be used either by the test runner or inside the browser. 
`browser` are scripts that are typically *injected* in the browser such that they are available within the browser's context.

If you have set up the files properly, you can run the tests using::

    phest.js examples/google

If you installed the phest npmjs package only locally, you need to put the `bin` directory of phest in your `$PATH`. If not, you need to address that executable file explicitly with node::

    node ./node_modules/phest/bin/phest.js examples/google

Limitations
-----------


Development
-----------

Development was almost only done for the project mentioned in "Motivation", but let's be serious:
I am not sure how many features I can implement, but I will look into every pull request and accept reasonable ones.
Problems? Besides creating issues at github, you can `mail <mailto:admin@lukas-prokop.at>`_ me.

Development progresses at `github <http://github.com/prokls/phest.git>`_.

Cheers, prokls
