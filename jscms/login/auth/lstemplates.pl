#!/usr/bin/perl -w
opendir my $dir, "../../templates/info" or die "Cannot open directory: $!";
my @files = readdir $dir;
closedir $dir;
my @l;
foreach my $f (@files) {
	next if $d =~ /^\./;
	next if -d $f;
	next unless $f =~ s/\.js$//;
	$f =~ s/"/\\"/g;
	push @l,'"'.$f.'"';
}
print join(',',@l);
