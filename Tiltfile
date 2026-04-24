# Welcome to Tilt!
#   To get you started as quickly as possible, we have created a
#   starter Tiltfile for you.
#
#   Uncomment, modify, and delete any commands as needed for your
#   project's configuration.


# Output diagnostic messages
#   You can print log messages, warnings, and fatal errors, which will
#   appear in the (Tiltfile) resource in the web UI. Tiltfiles support
#   multiline strings and common string operations such as formatting.
#
#   More info: https://docs.tilt.dev/api.html#api.warn
print('Initialized iStream via tilt')

config.define_string_list("test")
cfg = config.parse()
test = cfg.get('test', [])
if 'stream' in test:
  print("using docker_compose.stream.yml")
  docker_compose("./docker-compose.stream.yml")
if 'backend' in test:
  print("using docker_compose.backend.yml")
  docker_compose("./docker-compose.backend.yml")
else:
  print("using docker_compose.yml")
  docker_compose("./docker-compose.yml")



