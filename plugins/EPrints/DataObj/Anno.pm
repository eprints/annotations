package EPrints::DataObj::Anno;

use EPrints;
use EPrints::DataObj;

@ISA = ( 'EPrints::DataObj' );

use strict;

sub get_dataset_id { "anno" }

sub indexable { return 1; }

sub get_system_field_info
{
  my( $class ) = @_;

  return
  (
    { name => "annoid", type => "counter", sql_counter => "anno", sql_index => 1 },
    # { name => "key", type => "text", required => 1, input_cols => 40 }, # compound key : dataset/dataobj/fieldname/revision/pos
    { name => "record", type => "text", required => 1, input_cols => 40, sql_index => 1 }, #  dataset/dataobj
    { name => "key", type => "text", required => 1, input_cols => 40, sql_index => 1 }, # compound key : fieldname/revision/pos

    { name => "note", type => "longtext", required => 1, input_cols => 40 }, # textual payload
    { name => "type", type => "set", required => 1, options => [qw/ simple provenance url threaded /] },
    { name => "info", type => "longtext", required => 1, input_cols => 40 }, # to carry formatted info, likely json, depends on type
    { name => "security", type => "set", required => 1, options => [qw/ public user staff admin /] }, # who can access this
  );
}

# info : timestamp, co-ords, offset, author, ...

sub create_anno
{
  my( $class, $session, $data ) = @_;

  my $anno = $class->create_from_data( $session, $data );

  return $anno;
}

sub delete_anno
{
  my( $self, $session ) = @_;

  $self->delete;
}

1;
