PROJECT_NAME="cigar_matrix"
PROJECT_DIR="/opt/$PROJECT_NAME"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd)"
WORKSPACE=$(dirname ${DIR})
# NODE_VERSION="14.x"  # You can change it to the desired Node.js version
# MONGO_DIR="/data/db"

function tryexec() {
  "$@"
  retval=$?
  [[ $retval -eq 0 ]] && return 0
  echo "Error: Following command has failed"
  echo "  $@"
  echo "Value returned: ${retval}"
  exit 254
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
    echo "Stoping all services..."
    sudo pm2 show cigarmatrix-api
    pm2_proc_exists=$?
    #  tryexec sudo systemctl stop mongod.service
    # tryexec sudo systemctl stop nginx
    # [[ $pm2_proc_exists -eq 0 ]] && tryexec sudo pm2 delete cigarmatrix-api
    if [[ $pm2_proc_exists -eq 0 ]]; then 
        tryexec sudo pm2 delete cigarmatrix-api
    fi
    # free_port 27017
    # free_port 80
    # free_port 3000
}

function main() {
    if [[ $# -eq 0 ]]; then
        stop_services
        build_api
        setup_nginx
        build_ui
    else
        case "$1" in
            -a) 
                stop_services
                build_api 
                ;;
            -u) 
                build_ui 
                ;;
            -ng) 
                setup_nginx 
                ;;
            *) 
                echo "Invalid argument: $1. Valid arguments are '-a' for build_api, '-u' for build_ui, '-ng' for setup_nginx." 
                exit 1
                ;;
        esac
    fi
}

main "$@"