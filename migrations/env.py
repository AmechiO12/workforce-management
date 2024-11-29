import logging
from logging.config import fileConfig
from flask import current_app
from alembic import context

# Alembic Config object, providing access to the .ini file
config = context.config

# Configure logging using the settings from alembic.ini
fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')

def get_engine():
    """
    Retrieve the SQLAlchemy engine from the Flask application context.
    This ensures compatibility with Flask-SQLAlchemy versions.
    """
    try:
        # For Flask-SQLAlchemy < 3.0
        return current_app.extensions['migrate'].db.get_engine()
    except (TypeError, AttributeError):
        # For Flask-SQLAlchemy >= 3.0
        return current_app.extensions['migrate'].db.engine


def get_engine_url():
    """
    Retrieve the database connection URL from the SQLAlchemy engine.
    """
    try:
        return get_engine().url.render_as_string(hide_password=False).replace('%', '%%')
    except AttributeError:
        return str(get_engine().url).replace('%', '%%')


def get_metadata():
    """
    Get the target metadata for schema autogeneration.
    Handles cases where multiple metadatas are used.
    """
    target_db = current_app.extensions['migrate'].db
    return target_db.metadatas.get(None, target_db.metadata)


# Set the SQLAlchemy URL dynamically from the Flask application
config.set_main_option('sqlalchemy.url', get_engine_url())

def run_migrations_offline():
    """
    Execute migrations in offline mode.
    Configures the context with just a database URL.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=get_metadata(),
        literal_binds=True
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """
    Execute migrations in online mode.
    Connects to the database and applies migrations directly.
    """

    def process_revision_directives(context, revision, directives):
        """
        Prevent creation of empty migration files.
        """
        if getattr(config.cmd_opts, 'autogenerate', False):
            script = directives[0]
            if script.upgrade_ops.is_empty():
                directives[:] = []
                logger.info('No schema changes detected.')

    conf_args = current_app.extensions['migrate'].configure_args
    if conf_args.get("process_revision_directives") is None:
        conf_args["process_revision_directives"] = process_revision_directives

    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=get_metadata(),
            **conf_args
        )

        with context.begin_transaction():
            context.run_migrations()


# Determine the mode and execute migrations
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
