# Fieldnotes
![]()
A map tool to easily corwdsource notes from the field.

## Features
- Customize and deploy the entire tool for a reporting project within minutes
- Customizable basemap style and data using [Mapbox](https://www.mapbox.com)
- Mobile friendly interface
- Customizable reporting forms

## Usage
**Configure a new instance**
- Create a new [Mapbox dataset](https://www.mapbox.com/studio/datasets/)
- Update the [username](https://github.com/osmlab/fieldnotes/blob/master/index.js#L3) and [datasetId](https://github.com/osmlab/fieldnotes/blob/master/index.js#L2) from the Mapbox dataset url
- Create and update the [Mapbox dataset accessToken](https://github.com/osmlab/fieldnotes/blob/master/index.js#L4).
- Set the initial [map coordinates](https://github.com/osmlab/fieldnotes/blob/master/index.js#L14).

## Develop
You will need node and jekyll installed.
- Clone the repo and `cd`
- `npm install && npm start`

### Components
- [OpenStreetMap Project](http://osm.org) for the base map data.
- [Mapbox datasets API](https://www.mapbox.com/studio/datasets/) for storing the data
- [Mapbox Studio](https://www.mapbox.com/studio) to style the basemap
- [Mapbox GL](https://www.mapbox.com/mapbox-gl-js/) to render and interact with the map in the browswer
