Feature: Testing interaction with the Google website

Scenario: load the website
  Given https://google.com/
   Then 'Google Search' button exists

Scenario: enter a query
  Given https://google.com/
   When enter 'Donald Knuth' into the search bar
    And click enter
   Then expect en.wikipedia.org among search results
