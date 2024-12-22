#!/bin/bash

# Variables
PROJECT_NAME="cigar_matrix"
PROJECT_DIR="/opt/$PROJECT_NAME"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd)"
WORKSPACE=$(dirname ${DIR})
NODE_VERSION="14.x"  # You can change it to the desired Node.js version
MONGO_DIR="/data/db"

function tryexec() {
  "$@"
  retval=$?
  [[ $retval -eq 0 ]] && return 0
  echo "Error: Following command has failed"
  echo "  $@"
  echo "Value returned: ${retval}"
  exit 254
}

echo "Updating system packages..."
tryexec sudo apt update && sudo apt upgrade -y

function install_packages() {
    echo "Installing necessary packages..."
    tryexec sudo apt install -y build-essential curl gnupg2 nginx

    echo "Downloading Node Version Manager(nvm)"
    tryexec curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
    tryexec export NVM_DIR="$HOME/.nvm"
    tryexec [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    tryexec [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

    echo "Installing Node.js and npm using NVM..."
    # curl -sL https://deb.nodesource.com/setup_$NODE_VERSION | sudo -E bash -
    # sudo apt-get install -y nodejs
    tryexec nvm install 20
    tryexec nvm alias default 20
    tryexec nvm use default

    # echo "Installing MongoDB..."
    # wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
    # echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
    # sudo apt-get update
    # sudo apt-get install -y mongodb-org

    # echo "Starting and enabling MongoDB service..."
    # sudo systemctl start mongod
    # sudo systemctl enable mongod
    
    # echo "Setting MongoDB data directory..."
    # sudo mkdir -p $MONGO_DIR
    # sudo chown -R mongodb:mongodb $MONGO_DIR

    echo "Creating project directories..."
    tryexec sudo mkdir -p $PROJECT_DIR

    echo "Setting permissions for project directories..."
    tryexec sudo chown -R $USER:$USER $PROJECT_DIR/
    tryexec sudo chmod -R 755 $PROJECT_DIR

    echo "Installing PM2 to manage Node.js process..."
    tryexec sudo npm install -g pm2

}

function build_ui() {
    echo "Building UI"
    tryexec sudo rm -rf $PROJECT_DIR/ui
    tryexec sudo cp -r $WORKSPACE/ui $PROJECT_DIR/
    pushd $PROJECT_DIR/ui
    # The contents of the .npm directory are created with root user ownership due to which the user ownership is being
    # changed to the current non root user running the installer script, otherwise the npm install command fails on a
    # fresh setup.
    # https://drive.google.com/file/d/1N5MiJSUQWVbJsvNeGh6tTC1s9nTaSDog/view?usp=sharing
    # tryexec sudo chown -R ${USER}:${USER} "/home/${USER}/.npm"
    tryexec sudo npm install
    tryexec sudo npm run build --omit=dev
    tryexec sudo rm -rf /var/www/html/*
    tryexec sudo cp -rf dist/* /var/www/html/
    tryexec sudo rm -rf dist/
    popd
}

function build_api() {
    echo "Building API Server"
    tryexec sudo rm -rf $OPT_DIR/backend
    tryexec sudo cp -r $WORKSPACE/backend $OPT_DIR/
    # tryexec cp $WORKSPACE/.env $OPT_DIR/
    pushd $OPT_DIR/backend
    tryexec sudo npm install
    tryexec sudo npm run build
    tryexec npm run start:prod
    tryexec pm2 save
    # tryexec pm2 startup
    tryexec sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
    popd
}

function setup_nginx() {
    echo "Setting up Nginx as a reverse proxy..."
    tryexec sudo cp $WORKSPACE/scripts/default $PROJECT_DIR/default
    # tryexec sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/$PROJECT_NAME
    tryexec sudo cp $PROJECT_DIR/default /etc/nginx/sites-available/default
    tryexec sudo nginx -t
    tryexec sudo systemctl reload nginx
    tryexec sudo systemctl restart nginx
    # sudo ln -s /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    # sudo unlink /etc/nginx/sites-enabled/default
}

function stop_services() {
    # tryexec sudo systemctl stop nginx
    tryexec sudo pm2 del cigarmatrix-api
}

# function stop_services() {
#     echo "Stoping all services..."
#     pm2 show cedge-tool
#     pm2_proc_exists=$?
#     #  tryexec sudo systemctl stop mongod.service
#     tryexec sudo systemctl stop nginx
#     [[ $pm2_proc_exists -eq 0 ]] && tryexec sudo pm2 delete cigarmatrix-api
# #   free_port 27017
# #   free_port 80
# #   free_port 3000
# }


install_packages
stop_services
build_api
setup_nginx
build_ui

echo "Installation complete. Your MERN environment is set up."
echo "Project Directory: $PROJECT_DIR"
echo "Node.js Version: $(node -v)"
echo "NPM Version: $(npm -v)"
echo "MongoDB Version: $(mongod --version)"
echo "Nginx is configured to proxy requests to app running on port 5000."