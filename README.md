# FeedME Colors

This project is a simple inventory website/color picker for a small 3D printing
project that I have. It makes allowing people to choose colors for their prints
much easier than having to take pictures of what I have in stock or send them
links to the colors I have.

Updates to the inventory are done via a simple JSON
inventory file; Changing the file and committing it to Git generates the
page on Github pages.

## How it Works

There are three steps that are needed.

1. The data from the [Open Filament Database](https://github.com/OpenFilamentCollective/open-filament-database) must downloaded. Use the filaments.db
file from their most recent release.

2. The ```resolve-filaments.py``` script must be run to generate ```resolved_stock.json``` from the inventory file and the database.

3. The ```static``` directory must be published as a page.

The Github workflow in this repository does all of these steps automatically.

## FeedME

FeedME is a raised stand feeder that I developed to help cats with feline
megaesophagus. The model can be found on my MakerWorld [here](https://makerworld.com/en/models/871558-feedme-cat-megaesophagus-feeder).
