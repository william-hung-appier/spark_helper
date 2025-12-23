const DEFAULT_FALLBACK_HTML = `<html lang="en"><head>
<meta charset="UTF-8">
<title>Appier Data Catalog</title>
</head>
<body>
<div class="container">
<div>
  <div class="h4">Data Source Schema: <a href="/detail/imp_join_all2">imp_join_all2</a></div>
</div>
<table id="tb_sortable" class="table table-hover table-responsive tablesorter tablesorter-default" role="grid">
  <thead>
    <tr role="row" class="tablesorter-headerRow">
      <th>#</th>
      <th>Field Name</th>
      <th>Field Type</th>
      <th>Description</th>
      <th>Value Mapping</th>
      <th>UDF</th>
      <th>Note</th>
    </tr>
  </thead>
  <tbody aria-live="polite" aria-relevant="all">
  <tr role="row">
      <td>21</td>
      <td>ad_group_prerank_info</td>
      <td>struct</td>
      <td>object containing ad group prerank info</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>56</td>
      <td>click_ext_info</td>
      <td>struct</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>114</td>
      <td>impreq_rtb_info</td>
      <td>struct</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>143</td>
      <td><font color="silver">imps{}.</font>placement</td>
      <td>struct</td>
      <td>extra information about the ad placement</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>156</td>
      <td>load_rtb_info</td>
      <td>struct</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>202</td>
      <td>skoverlay</td>
      <td>struct</td>
      <td>parameters to control a potential SKOverlay</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>204</td>
      <td>supply_chain</td>
      <td>struct</td>
      <td>a supply chain is composed primarily of a set of nodes</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>1</td>
      <td>action_time</td>
      <td>integer</td>
      <td>any action time (not necessarily the first one)</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>3</td>
      <td><font color="silver">actions[].</font>action_id</td>
      <td>string</td>
      <td>action id</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>24</td>
      <td>age</td>
      <td>integer</td>
      <td>year of birth. ex: 1988</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>25</td>
      <td>app_id</td>
      <td>binary</td>
      <td>exchange-specific app id</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>26</td>
      <td>app_name</td>
      <td>binary</td>
      <td>A human readable name</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>27</td>
      <td>app_pub</td>
      <td>binary</td>
      <td>exchange-specific publisher id</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>28</td>
      <td>app_type</td>
      <td>integer</td>
      <td>the type of published media</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>29</td>
      <td>appier_cookie_uid</td>
      <td>binary</td>
      <td>appier cookie id</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>35</td>
      <td>atts</td>
      <td>integer</td>
      <td>(iOS Only) app tracking authorization status</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>36</td>
      <td>auction_result</td>
      <td>string</td>
      <td>auction result from partner feedback</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>37</td>
      <td>auction_type</td>
      <td>integer</td>
      <td>auction type, 1=first price, 2=second price, 3=fixed</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>40</td>
      <td>bid_appier_id</td>
      <td>binary</td>
      <td>bidobjid, used to join all log types</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>41</td>
      <td>bid_deal_id</td>
      <td>string</td>
      <td>deal id for PMP</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>42</td>
      <td>bid_price_appier</td>
      <td>double</td>
      <td>bid price in appier dollar</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>43</td>
      <td>bid_user_list</td>
      <td>binary</td>
      <td>the list id used to decide bid price</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>44</td>
      <td>bidder</td>
      <td>string</td>
      <td>bidder hostname</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>45</td>
      <td>bidding_age_group</td>
      <td>integer</td>
      <td>age_group used for bidding</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>46</td>
      <td>bidding_alg</td>
      <td>binary</td>
      <td>algorithm codename</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>48</td>
      <td>bidding_gender</td>
      <td>integer</td>
      <td>gender used for bidding</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>49</td>
      <td>browser</td>
      <td>integer</td>
      <td>browser</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>51</td>
      <td>bundle_id</td>
      <td>binary</td>
      <td>platform-specific application identifier</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>53</td>
      <td>cid</td>
      <td>string</td>
      <td>cid, ad group id</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>54</td>
      <td>city_gnid</td>
      <td>long</td>
      <td>geoname id of the city</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>55</td>
      <td>click_country</td>
      <td>string</td>
      <td>country of client ip from click</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>76</td>
      <td>click_handler_version</td>
      <td>integer</td>
      <td>click handler version</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>77</td>
      <td>click_ip</td>
      <td>binary</td>
      <td>IP address in click_rtb/click_ext log</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>78</td>
      <td>click_is_counted</td>
      <td>boolean</td>
      <td>whether this click is counted in iDash</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>79</td>
      <td>click_is_fraud</td>
      <td>boolean</td>
      <td>whether this click is marked as fraud</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>80</td>
      <td>click_through_rate</td>
      <td>double</td>
      <td>Historical click-through rate</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>81</td>
      <td>click_time</td>
      <td>integer</td>
      <td>click time</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>83</td>
      <td>connection_type</td>
      <td>integer</td>
      <td>network connection type</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>84</td>
      <td>country</td>
      <td>integer</td>
      <td>country code ISO 3166-1 alpha-2</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>85</td>
      <td>crid</td>
      <td>binary</td>
      <td>creative id</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>86</td>
      <td>crpid</td>
      <td>string</td>
      <td>idash creative pool id</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>87</td>
      <td>currency</td>
      <td>integer</td>
      <td>currency</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>88</td>
      <td>current_age</td>
      <td>integer</td>
      <td>user age</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>89</td>
      <td>deal_id</td>
      <td>binary</td>
      <td>deal identifier for private marketplace</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>91</td>
      <td>device_type</td>
      <td>integer</td>
      <td>device type</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>92</td>
      <td>displaymanager</td>
      <td>string</td>
      <td>name of ad mediation partner</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>93</td>
      <td>displaymanagerver</td>
      <td>string</td>
      <td>version of ad mediation partner</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>94</td>
      <td>dnt</td>
      <td>boolean</td>
      <td>do not track flag</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>100</td>
      <td>gender</td>
      <td>integer</td>
      <td>0: unknown, 1: female, 2: male, 3: other</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>102</td>
      <td>hwv</td>
      <td>string</td>
      <td>hardware version of the device</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>103</td>
      <td>imp_height</td>
      <td>integer</td>
      <td>height of the impression</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>104</td>
      <td>imp_is_instl</td>
      <td>boolean</td>
      <td>whether ad is interstitial</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>105</td>
      <td>imp_maxbitrate</td>
      <td>long</td>
      <td>maximum video bit rate in Kbps</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>106</td>
      <td>imp_maxduration</td>
      <td>integer</td>
      <td>maximum video duration in seconds</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>107</td>
      <td>imp_minbitrate</td>
      <td>integer</td>
      <td>minimum video bit rate in Kbps</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>108</td>
      <td>imp_minduration</td>
      <td>integer</td>
      <td>minimum video duration in seconds</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>109</td>
      <td>imp_position</td>
      <td>integer</td>
      <td>ad position on screen</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>111</td>
      <td>imp_type</td>
      <td>integer</td>
      <td>impression type</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>112</td>
      <td>imp_width</td>
      <td>integer</td>
      <td>width of the impression</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>113</td>
      <td>impreq_country</td>
      <td>string</td>
      <td>country of client ip from impreq_rtb</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>131</td>
      <td>impreq_time</td>
      <td>integer</td>
      <td>RTB: bid time, others: click time</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>132</td>
      <td>imps{}</td>
      <td>map&lt;string, struct&gt;</td>
      <td>supported impression types and sizes</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>151</td>
      <td>is_external</td>
      <td>boolean</td>
      <td>whether this is external traffic</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>152</td>
      <td>is_rewarded</td>
      <td>boolean</td>
      <td>whether user receives reward after viewing</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>153</td>
      <td>isp</td>
      <td>integer</td>
      <td>ISP</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>155</td>
      <td>lat</td>
      <td>double</td>
      <td>latitude</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>160</td>
      <td>lon</td>
      <td>double</td>
      <td>longitude</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>167</td>
      <td>metro_code</td>
      <td>integer</td>
      <td>DMA-based numeric code for US metro area</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>168</td>
      <td>minimum_bid_to_win</td>
      <td>double</td>
      <td>price that should have been exceeded to win</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>169</td>
      <td>mmp_click_tracker_location</td>
      <td>string</td>
      <td>when MMP click tracker will be triggered</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>170</td>
      <td>mmp_imp_tracker_location</td>
      <td>string</td>
      <td>when MMP impression tracker will be triggered</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>175</td>
      <td>net_cookie_uid</td>
      <td>binary</td>
      <td>cookie id from exchange</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>176</td>
      <td>os</td>
      <td>integer</td>
      <td>device os</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>177</td>
      <td>page</td>
      <td>binary</td>
      <td>URL of the web page or app store URL</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>178</td>
      <td>partner_id</td>
      <td>integer</td>
      <td>partner id</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>179</td>
      <td>payment_id_chain</td>
      <td>string</td>
      <td>payment ID chain string</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>180</td>
      <td>persona_age_group</td>
      <td>integer</td>
      <td>age group from appier persona db</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>182</td>
      <td>persona_gender</td>
      <td>integer</td>
      <td>gender from appier persona db</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>183</td>
      <td>pf_appier</td>
      <td>double</td>
      <td>minimum bid price in appier dollar</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>184</td>
      <td>publisher_country</td>
      <td>string</td>
      <td>billing address country of publisher</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>185</td>
      <td>region_code</td>
      <td>binary</td>
      <td>ISO 3166-1 alpha-2 country + region code</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>186</td>
      <td>req_id</td>
      <td>binary</td>
      <td>request id provided by exchange</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>187</td>
      <td>rtb_cost_usd_appier</td>
      <td>double</td>
      <td>cost of impression in USD appier</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>188</td>
      <td>show_country</td>
      <td>string</td>
      <td>country of client ip from show_rtb</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>189</td>
      <td>show_ip</td>
      <td>binary</td>
      <td>IP address in show_rtb log</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>190</td>
      <td>show_time</td>
      <td>integer</td>
      <td>show time</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>191</td>
      <td>skadn_campaign</td>
      <td>string</td>
      <td>campaign id compatible with Apple's spec</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>201</td>
      <td>skippable</td>
      <td>boolean</td>
      <td>whether video is skippable</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>207</td>
      <td>support_asv</td>
      <td>boolean</td>
      <td>eligible for Auto Store</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>208</td>
      <td>support_dualendcard</td>
      <td>boolean</td>
      <td>eligible for double end cards</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>209</td>
      <td>support_skoverlay</td>
      <td>boolean</td>
      <td>eligible for SKOverlay</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>210</td>
      <td>tagid</td>
      <td>binary</td>
      <td>identifier for specific ad placement</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>211</td>
      <td>time</td>
      <td>integer</td>
      <td>time imbedded in bidobjid</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>212</td>
      <td>timezone</td>
      <td>integer</td>
      <td>device timezone</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>217</td>
      <td>touch_level</td>
      <td>integer</td>
      <td>banner creative's sensitivity level</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>218</td>
      <td>ua_device_model</td>
      <td>integer</td>
      <td>device model derived from user agent</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>219</td>
      <td>user_db_info</td>
      <td>string</td>
      <td>additional user information in json string</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>220</td>
      <td>viewability</td>
      <td>integer</td>
      <td>Viewability percentage for ad slot</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>221</td>
      <td>web_host</td>
      <td>binary</td>
      <td>domain of the web page</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>222</td>
      <td>win_country</td>
      <td>string</td>
      <td>country of client ip from win_rtb</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>223</td>
      <td>win_ip</td>
      <td>binary</td>
      <td>IP address in win_rtb log</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>224</td>
      <td>win_price_appier</td>
      <td>double</td>
      <td>win price in appier dollar</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>225</td>
      <td>win_time</td>
      <td>integer</td>
      <td>win time</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>226</td>
      <td>zip</td>
      <td>binary</td>
      <td>postal code</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>2</td>
      <td>actions[]</td>
      <td>array&lt;struct&gt;</td>
      <td>actions of this request</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>31</td>
      <td>arms[]</td>
      <td>array&lt;struct&gt;</td>
      <td>actions from arm</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>38</td>
      <td>audience_list[]</td>
      <td>array&lt;string&gt;</td>
      <td>the audience lists user is included in</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>39</td>
      <td>bcat[]</td>
      <td>array&lt;string&gt;</td>
      <td>blocked advertiser categories</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>52</td>
      <td>categories[]</td>
      <td>array&lt;integer&gt;</td>
      <td>IAB content categories</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>90</td>
      <td>deals[]</td>
      <td>array&lt;binary&gt;</td>
      <td>information of PMP deals</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>110</td>
      <td>imp_supported_api[]</td>
      <td>array&lt;integer&gt;</td>
      <td>supported API frameworks</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>154</td>
      <td>lang[]</td>
      <td>array&lt;integer&gt;</td>
      <td>browser or device language</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>159</td>
      <td>log_types[]</td>
      <td>array&lt;string&gt;</td>
      <td>the log types in this record</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>161</td>
      <td>losing_bids[]</td>
      <td>array&lt;struct&gt;</td>
      <td>information of losing ad groups</td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>171</td>
      <td>mmp_trackings[]</td>
      <td>array&lt;struct&gt;</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr><tr role="row">
      <td>213</td>
      <td>topics[]</td>
      <td>array&lt;struct&gt;</td>
      <td>topics user might be interested in</td>
      <td></td>
      <td></td>
      <td></td>
    </tr></tbody>
</table>
</div>
</body></html>`;