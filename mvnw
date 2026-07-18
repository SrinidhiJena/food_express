#!/bin/bash
# Minimal custom maven wrapper
MAVEN_VERSION="3.9.6"
MAVEN_DIR="$HOME/.m2/wrapper/apache-maven-$MAVEN_VERSION"
if [ ! -d "$MAVEN_DIR" ]; then
    echo "Downloading Maven $MAVEN_VERSION..."
    mkdir -p "$HOME/.m2/wrapper"
    curl -sSLo /tmp/maven.tar.gz "https://archive.apache.org/dist/maven/maven-3/$MAVEN_VERSION/binaries/apache-maven-$MAVEN_VERSION-bin.tar.gz"
    tar -xzf /tmp/maven.tar.gz -C "$HOME/.m2/wrapper"
    rm /tmp/maven.tar.gz
fi
exec "$MAVEN_DIR/bin/mvn" "$@"
