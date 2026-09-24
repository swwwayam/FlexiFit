# FlexiFit

FlexiFit is a web application organized into dedicated backend and frontend directories.

## Project Structure

* **Backend**: A Node.js environment configured via `package.json` and `package-lock.json` files. The primary application logic is housed in `server.js`, supported by a database connection script named `db.js`. The backend relies on several dependencies stored in the `node_modules` folder, including standard web framework packages like `express`, `cors`, and `body-parser`.


* **Frontend**: The client-side interface, which contains an `index.html` entry file.



## Prerequisites

* Node.js and npm installed on your local machine.
* A configured database (based on the presence of the `db.js` file).



## Setup & Installation

1. Open your terminal and navigate to the backend server directory located at `FlexiFit-main/backend`.


2. Install the necessary Node modules utilizing the provided `package.json` file by running `npm install`.


3. Start up the backend server by executing the main script with `node server.js`.


4. Access the user interface by opening `FlexiFit-main/frontend/index.html` in your preferred web browser.
