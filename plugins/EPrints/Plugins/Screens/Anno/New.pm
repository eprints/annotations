package EPrints::Plugin::Screen::Anno::New;

use EPrints::Plugin::Screen::NewDataobj;
@ISA = ( 'EPrints::Plugin::Screen::NewDataobj' );

use strict;

sub new
{
	my( $class, %params ) = @_;

	my $self = $class->SUPER::new(%params);

        $self->{actions} = [qw/ create /];
# does not appear, wahh
        $self->{appears} = [
                {
#                        place => "dataobj_tools",
#                        place => "action_list",
                        place => "admin_actions_system",
                        action => "create",
                        position => 100,
                }
        ];

	return $self;
}

sub allow_create
{
	my ( $self ) = @_;

return 1;

        my $ds = $self->{processor}->{dataset}; # set by Screen::Listing
        if( defined $ds && $ds->base_id eq 'anno' )
        {
		return $self->allow( "anno/write" );
	}

	return 0;
}

sub action_create
{
	my( $self ) = @_;

	my $ds = $self->{processor}->{session}->dataset( "anno" );

	my $user = $self->{session}->current_user;

	$self->{processor}->{dataobj} = $ds->create_object( $self->{session}, { 
		userid => $user->get_value( "userid" ) } );

	if( !defined $self->{processor}->{dataobj} )
	{
		my $db_error = $self->{session}->get_database->error;
		$self->{processor}->{session}->log( "Database Error: $db_error" );
		$self->{processor}->add_message( 
			"error",
			$self->html_phrase( "db_error" ) );
		return;
	}

	$self->{processor}->{screenid} = "Anno::Edit";
}

1;
