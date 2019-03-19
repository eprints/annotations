use EPrints::DataObj::Anno;

$c->{datasets}->{anno} = {
  class => "EPrints::DataObj::Anno",
  sqlname => "anno",
};

push @{$c->{user_roles}->{user}}, qw{
  +anno/view:owner
  +anno/edit:owner
  +anno/destroy:owner
};

push @{$c->{user_roles}->{editor}}, qw{
  +anno/view:owner
  +anno/edit:owner
  +anno/destroy:owner
};

push @{$c->{user_roles}->{admin}}, qw{
  +anno/view:editor
  +anno/edit:editor
  +anno/destroy:editor
};

$c->{plugins}{"Screen::Anno::Edit"}{params}{disable} = 0;
$c->{plugins}{"Screen::Anno::New"}{params}{disable} = 0;
