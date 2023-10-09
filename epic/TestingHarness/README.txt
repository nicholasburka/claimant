1. FEATURE_BROWSER_EMULATION settings

Set the FEATURE_BROWSER_EMULATION setting to one of the following (8000 or 10001) depending on
the Epic and IE version, and click the Relaunch button. A new instance of the tester will run.
Use the instance which displays the FEATURE_BROWSER_EMULATION you want to test with.

Epic 2012 + IE8:  8000
Epic 2012 + IE9:  8000
Epic 2014 + IE9:  8000
Epic 2014 + IE10: 8000
Epic 2014 + IE11: 10001
Epic 2015 + IE11: 10001

2. Enter the URL of the web page you want to test and click the Navigate button.

3. The tester explicitly prevents new browser windows from showing.

4. Recommended document modes
It is recommended that web pages hosted in Hyperspace use the following document modes. Please
refer to the following MSDN article for how to specify document modes.
https://msdn.microsoft.com/en-us/library/jj676915%28v=vs.85%29.aspx

Epic 2012 + IE8:  IE8 standards mode
Epic 2012 + IE9:  IE9 standards mode
Epic 2014 + IE9:  IE9 standards mode
Epic 2014 + IE10: IE10 standards mode
Epic 2014 + IE11: IE10 standards mode
Epic 2015 + IE11: IE10 standards mode
